import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  FileText,
  AlertTriangle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ============ TYPES ============
interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  status: string | null;
  last_login: string | null;
  login_count: number | null;
  created_at: string | null;
  role: "admin" | "moderator" | "user";
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

// ============ MAIN COMPONENT ============
export const AdminPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // ============ USERS QUERY ============
  const { 
    data: users = [], 
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserProfile[]> => {
      console.log("[AdminPanel] Fetching users...");
      
      // Fetch profiles and roles in parallel
      const [profilesRes, rolesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, user_id, email, full_name, status, last_login, login_count, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_roles")
          .select("user_id, role"),
      ]);

      if (profilesRes.error) {
        console.error("[AdminPanel] Profiles fetch error:", profilesRes.error);
        throw profilesRes.error;
      }

      if (rolesRes.error) {
        console.error("[AdminPanel] Roles fetch error:", rolesRes.error);
        // Don't throw - roles might not exist for all users
      }

      // Create role lookup map
      const roleMap = new Map<string, "admin" | "moderator" | "user">();
      (rolesRes.data || []).forEach((r) => {
        roleMap.set(r.user_id, r.role as "admin" | "moderator" | "user");
      });

      const result = (profilesRes.data || []).map((profile) => ({
        ...profile,
        role: roleMap.get(profile.user_id) || "user",
      })) as UserProfile[];

      console.log("[AdminPanel] Fetched users:", result.length);
      return result;
    },
    staleTime: 10000,
    retry: 2,
  });

  // ============ LOGS QUERY ============
  const { 
    data: logs = [], 
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs 
  } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async (): Promise<SystemLog[]> => {
      console.log("[AdminPanel] Fetching logs...");
      
      // Fetch logs and profiles separately (no FK relationship exists)
      const [logsRes, profilesRes] = await Promise.all([
        supabase
          .from("system_logs")
          .select("id, user_id, action, details, created_at, user_agent")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("profiles")
          .select("user_id, email, full_name")
      ]);

      if (logsRes.error) {
        console.error("[AdminPanel] Logs fetch error:", logsRes.error);
        throw logsRes.error;
      }

      // Create a lookup map for profiles
      const profilesMap = new Map<string, { email: string | null; full_name: string | null }>();
      (profilesRes.data || []).forEach((p) => {
        profilesMap.set(p.user_id, { email: p.email, full_name: p.full_name });
      });

      // Merge logs with profile data
      const logsWithProfiles = (logsRes.data || []).map((log) => ({
        ...log,
        profiles: log.user_id ? profilesMap.get(log.user_id) || null : null,
      }));

      console.log("[AdminPanel] Fetched logs:", logsWithProfiles.length);
      return logsWithProfiles as SystemLog[];
    },
    staleTime: 10000,
    retry: 2,
  });

  // ============ MUTATIONS ============
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "moderator" | "user" }) => {
      console.log("[AdminPanel] Changing role for user:", userId, "to:", newRole);
      
      // Check if role exists
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

      // Log the action
      await supabase.from("system_logs").insert({
        action: "role_changed",
        details: { target_user_id: userId, new_role: newRole },
        user_agent: navigator.userAgent,
      });
    },
    onMutate: async ({ userId, newRole }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const prev = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) =>
        old?.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      return { prev };
    },
    onError: (error, _, ctx) => {
      console.error("[AdminPanel] Role change error:", error);
      if (ctx?.prev) queryClient.setQueryData(["admin-users"], ctx.prev);
      toast.error("Erreur lors du changement de rôle");
    },
    onSuccess: (_, { newRole }) => {
      const roleLabels = { admin: "Administrateur", moderator: "Modérateur", user: "Utilisateur" };
      toast.success(`Rôle changé en ${roleLabels[newRole]}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      console.log("[AdminPanel] Changing status for user:", userId, "to:", status);
      
      const { error } = await supabase
        .from("profiles")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;

      await supabase.from("system_logs").insert({
        action: status === "suspended" ? "user_suspended" : "user_activated",
        details: { target_user_id: userId },
        user_agent: navigator.userAgent,
      });
    },
    onMutate: async ({ userId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const prev = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) =>
        old?.map((u) => (u.user_id === userId ? { ...u, status } : u))
      );
      return { prev };
    },
    onError: (error, _, ctx) => {
      console.error("[AdminPanel] Status change error:", error);
      if (ctx?.prev) queryClient.setQueryData(["admin-users"], ctx.prev);
      toast.error("Erreur lors du changement de statut");
    },
    onSuccess: (_, { status }) => {
      toast.success(status === "suspended" ? "Utilisateur suspendu" : "Utilisateur activé");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("[AdminPanel] Deleting user profile:", userId);
      
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;

      await supabase.from("system_logs").insert({
        action: "user_deleted",
        details: { deleted_user_id: userId },
        user_agent: navigator.userAgent,
      });
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const prev = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) =>
        old?.filter((u) => u.user_id !== userId)
      );
      return { prev };
    },
    onError: (error, _, ctx) => {
      console.error("[AdminPanel] Delete error:", error);
      if (ctx?.prev) queryClient.setQueryData(["admin-users"], ctx.prev);
      toast.error("Erreur lors de la suppression");
    },
    onSuccess: () => {
      toast.success("Profil utilisateur supprimé");
      setDeleteUserId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  // ============ FILTERED DATA ============
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term) ||
        u.role?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // ============ STATS ============
  const stats = useMemo(() => ({
    totalUsers: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    moderators: users.filter((u) => u.role === "moderator").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    todayLogs: logs.filter(
      (l) => l.created_at && format(new Date(l.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    ).length,
    totalLogs: logs.length,
  }), [users, logs]);

  // ============ HELPERS ============
  const getRoleBadge = useCallback((role: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      admin: { variant: "destructive", label: "Admin" },
      moderator: { variant: "secondary", label: "Modérateur" },
      user: { variant: "default", label: "Utilisateur" },
    };
    const c = config[role] || config.user;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  }, []);

  const getStatusBadge = useCallback((status: string | null) => {
    return status === "suspended" ? (
      <Badge variant="outline" className="border-destructive text-destructive">
        <Ban className="h-3 w-3 mr-1" />
        Suspendu
      </Badge>
    ) : (
      <Badge variant="outline" className="border-green-500 text-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        Actif
      </Badge>
    );
  }, []);

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
    } catch {
      return "-";
    }
  }, []);

  const exportLogs = useCallback(() => {
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
    toast.success("Logs exportés avec succès");
  }, [logs]);

  const getActionLabel = useCallback((action: string) => {
    const labels: Record<string, string> = {
      user_signed_in: "Connexion",
      user_signed_out: "Déconnexion",
      user_suspended: "Suspension",
      user_activated: "Activation",
      user_deleted: "Suppression",
      role_changed: "Changement de rôle",
      equipment_added: "Ajout équipement",
      equipment_updated: "Modification équipement",
      equipment_deleted: "Suppression équipement",
    };
    return labels[action] || action;
  }, []);

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
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
              <Users className="h-4 w-4 text-blue-500" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.suspended > 0 && <span className="text-destructive">{stats.suspended} suspendu(s)</span>}
              {stats.suspended === 0 && "Tous actifs"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">{stats.moderators} modérateur(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">{stats.todayLogs} aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {new Set(logs.slice(0, 50).map((l) => l.user_id).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">Utilisateurs actifs récents</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {(usersError || logsError) && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Erreur de chargement</p>
              <p className="text-sm text-muted-foreground">
                {usersError?.message || logsError?.message || "Une erreur est survenue"}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => {
                refetchUsers();
                refetchLogs();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

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
          
          <div className="flex gap-2">
            {activeTab === "logs" && logs.length > 0 && (
              <Button onClick={exportLogs} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            )}
            <Button 
              onClick={() => activeTab === "users" ? refetchUsers() : refetchLogs()} 
              variant="ghost" 
              size="sm"
              disabled={usersLoading || logsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${usersLoading || logsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* ============ USERS TAB ============ */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    Gestion des utilisateurs
                  </CardTitle>
                  <CardDescription>
                    {filteredUsers.length} utilisateur(s) affiché(s)
                  </CardDescription>
                </div>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par email, nom ou rôle..."
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
                      <TableHead className="hidden lg:table-cell">Inscrit</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground font-medium">
                            {searchTerm ? "Aucun utilisateur trouvé" : "Aucun utilisateur inscrit"}
                          </p>
                          {searchTerm && (
                            <Button 
                              variant="link" 
                              onClick={() => setSearchTerm("")}
                              className="mt-2"
                            >
                              Effacer la recherche
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="truncate max-w-[200px]" title={user.email || ""}>
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {user.full_name || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="hidden sm:table-cell">{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                            {formatDate(user.created_at)}
                          </TableCell>
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
                                  disabled={user.role === "admin" || changeRoleMutation.isPending}
                                >
                                  <Shield className="h-4 w-4 mr-2 text-red-500" />
                                  Définir Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeRoleMutation.mutate({ userId: user.user_id, newRole: "moderator" })}
                                  disabled={user.role === "moderator" || changeRoleMutation.isPending}
                                >
                                  <Shield className="h-4 w-4 mr-2 text-blue-500" />
                                  Définir Modérateur
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeRoleMutation.mutate({ userId: user.user_id, newRole: "user" })}
                                  disabled={user.role === "user" || changeRoleMutation.isPending}
                                >
                                  <Shield className="h-4 w-4 mr-2 text-green-500" />
                                  Définir Utilisateur
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status !== "suspended" ? (
                                  <DropdownMenuItem 
                                    onClick={() => statusMutation.mutate({ userId: user.user_id, status: "suspended" })}
                                    disabled={statusMutation.isPending}
                                  >
                                    <Ban className="h-4 w-4 mr-2 text-orange-500" />
                                    Suspendre
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => statusMutation.mutate({ userId: user.user_id, status: "active" })}
                                    disabled={statusMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    Activer
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteUserId(user.user_id)}
                                  className="text-destructive focus:text-destructive"
                                  disabled={deleteMutation.isPending}
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

        {/* ============ LOGS TAB ============ */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Journaux d'activité
              </CardTitle>
              <CardDescription>
                Les 200 dernières actions système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {logsLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </div>
                    ))
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">Aucun log enregistré</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getActionLabel(log.action)}
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              {log.profiles?.email || "Système"}
                            </span>
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.created_at && formatDate(log.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera le profil de l'utilisateur. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
