import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Shield, 
  Users, 
  Activity, 
  Download, 
  Search, 
  MoreVertical, 
  RefreshCw,
  Ban,
  CheckCircle,
  Trash2,
  UserCog,
  Clock,
  FileText
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  status: string | null;
  last_login: string | null;
  login_count: number | null;
  created_at: string | null;
  role?: "admin" | "moderator" | "user";
}

interface SystemLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, any> | null;
  created_at: string | null;
  user_agent: string | null;
  profiles?: { email: string | null; full_name: string | null } | null;
}

export const AdminPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const queryClient = useQueryClient();

  // ============ USERS QUERY ============
  const { 
    data: users = [], 
    isLoading: usersLoading,
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ["admin-panel-users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const roleMap = new Map<string, "admin" | "moderator" | "user">();
      rolesRes.data?.forEach((r) => {
        roleMap.set(r.user_id, r.role as "admin" | "moderator" | "user");
      });

      return (profilesRes.data || []).map((profile) => ({
        ...profile,
        role: roleMap.get(profile.user_id) || "user",
      })) as UserProfile[];
    },
    staleTime: 30000,
  });

  // ============ LOGS QUERY ============
  const { 
    data: logs = [], 
    isLoading: logsLoading,
    refetch: refetchLogs 
  } = useQuery({
    queryKey: ["admin-panel-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_logs")
        .select(`
          id,
          user_id,
          action,
          details,
          created_at,
          user_agent,
          profiles:user_id (email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as unknown as SystemLog[];
    },
    staleTime: 30000,
  });

  // ============ MUTATIONS ============
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "moderator" | "user" }) => {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onMutate: async ({ userId, newRole }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-panel-users"] });
      const prev = queryClient.getQueryData<UserProfile[]>(["admin-panel-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-panel-users"], (old) =>
        old?.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin-panel-users"], ctx.prev);
      toast.error("Erreur lors du changement de rôle");
    },
    onSuccess: () => toast.success("Rôle modifié avec succès"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onMutate: async ({ userId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-panel-users"] });
      const prev = queryClient.getQueryData<UserProfile[]>(["admin-panel-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-panel-users"], (old) =>
        old?.map((u) => (u.user_id === userId ? { ...u, status } : u))
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin-panel-users"], ctx.prev);
      toast.error("Erreur lors du changement de statut");
    },
    onSuccess: (_, { status }) => {
      toast.success(status === "suspended" ? "Utilisateur suspendu" : "Utilisateur activé");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-panel-users"] });
      const prev = queryClient.getQueryData<UserProfile[]>(["admin-panel-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-panel-users"], (old) =>
        old?.filter((u) => u.user_id !== userId)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin-panel-users"], ctx.prev);
      toast.error("Erreur lors de la suppression");
    },
    onSuccess: () => toast.success("Utilisateur supprimé"),
  });

  // ============ HELPERS ============
  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const config: Record<string, { class: string; label: string }> = {
      admin: { class: "bg-red-500 text-white", label: "Admin" },
      moderator: { class: "bg-blue-500 text-white", label: "Modérateur" },
      user: { class: "bg-green-500 text-white", label: "Utilisateur" },
    };
    const c = config[role] || config.user;
    return <Badge className={c.class}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string | null) => {
    return status === "suspended" ? (
      <Badge variant="destructive">Suspendu</Badge>
    ) : (
      <Badge variant="default">Actif</Badge>
    );
  };

  const exportLogs = () => {
    const csv = [
      ["Date", "Utilisateur", "Action", "Détails"].join(";"),
      ...logs.map((log) =>
        [
          format(new Date(log.created_at || ""), "dd/MM/yyyy HH:mm:ss"),
          log.profiles?.email || "Système",
          log.action,
          JSON.stringify(log.details || {}),
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    link.click();
    toast.success("Logs exportés");
  };

  // ============ STATS ============
  const todayLogs = logs.filter(
    (l) => l.created_at && format(new Date(l.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  );
  const uniqueUsers = new Set(logs.map((l) => l.user_id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Panneau Administrateur</h2>
          <p className="text-sm text-muted-foreground">
            Gestion des utilisateurs et surveillance système
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Total inscrits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {users.filter((u) => u.role === "admin").length}
            </div>
            <p className="text-xs text-muted-foreground">Administrateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">{todayLogs.length} aujourd'hui</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Utilisateurs uniques</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs ({users.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="h-4 w-4" />
              Logs ({logs.length})
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "logs" && (
            <Button onClick={exportLogs} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          )}
        </div>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Gestion des utilisateurs
                </CardTitle>
                <Button onClick={() => refetchUsers()} variant="ghost" size="sm">
                  <RefreshCw className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="hidden sm:table-cell">Statut</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucun utilisateur trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell">{user.full_name || "-"}</TableCell>
                          <TableCell>{getRoleBadge(user.role || "user")}</TableCell>
                          <TableCell className="hidden sm:table-cell">{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => changeRoleMutation.mutate({ userId: user.user_id, newRole: "admin" })}
                                  disabled={user.role === "admin"}
                                >
                                  <Shield className="h-4 w-4 mr-2 text-red-500" />
                                  Définir Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeRoleMutation.mutate({ userId: user.user_id, newRole: "moderator" })}
                                  disabled={user.role === "moderator"}
                                >
                                  <Shield className="h-4 w-4 mr-2 text-blue-500" />
                                  Définir Modérateur
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeRoleMutation.mutate({ userId: user.user_id, newRole: "user" })}
                                  disabled={user.role === "user"}
                                >
                                  <Shield className="h-4 w-4 mr-2 text-green-500" />
                                  Définir Utilisateur
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === "active" ? (
                                  <DropdownMenuItem onClick={() => statusMutation.mutate({ userId: user.user_id, status: "suspended" })}>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Suspendre
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => statusMutation.mutate({ userId: user.user_id, status: "active" })}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activer
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm("Supprimer définitivement cet utilisateur ?")) {
                                      deleteMutation.mutate(user.user_id);
                                    }
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Logs Système
                </CardTitle>
                <Button onClick={() => refetchLogs()} variant="ghost" size="sm">
                  <RefreshCw className={`h-4 w-4 ${logsLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {logsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))
                  ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun log disponible
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              {log.action}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {log.profiles?.email || "Système"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {log.created_at && formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
