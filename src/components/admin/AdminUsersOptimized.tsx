import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Search, RefreshCw, Shield, UserCog, Ban, CheckCircle, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useSystemLogs } from "@/hooks/useSystemLogs";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function AdminUsersOptimized() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { logAction } = useSystemLogs();

  // Fetch users with TanStack Query for caching and optimistic updates
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles and roles in parallel
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      // Create a map of user_id to role for O(1) lookup
      const roleMap = new Map<string, "admin" | "moderator" | "user">();
      rolesResult.data?.forEach((r) => {
        roleMap.set(r.user_id, r.role as "admin" | "moderator" | "user");
      });

      return (profilesResult.data || []).map((profile) => ({
        ...profile,
        role: roleMap.get(profile.user_id) || "user",
      })) as UserProfile[];
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Mutation for changing roles with optimistic update
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "moderator" | "user" }) => {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
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

      await logAction("role_changed", { user_id: userId, new_role: newRole });
      return { userId, newRole };
    },
    onMutate: async ({ userId, newRole }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      
      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      
      // Optimistically update
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) =>
        old?.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      
      return { previousUsers };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(["admin-users"], context.previousUsers);
      }
      toast.error("Erreur lors du changement de rôle");
    },
    onSuccess: (data) => {
      toast.success(`Rôle changé en ${data.newRole}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  // Mutation for status changes
  const statusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("user_id", userId);
      if (error) throw error;
      
      await logAction(status === "suspended" ? "user_suspended" : "user_activated", { user_id: userId });
      return { userId, status };
    },
    onMutate: async ({ userId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const previousUsers = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) =>
        old?.map((u) => (u.user_id === userId ? { ...u, status } : u))
      );
      
      return { previousUsers };
    },
    onError: (_, __, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["admin-users"], context.previousUsers);
      }
      toast.error("Erreur lors du changement de statut");
    },
    onSuccess: (data) => {
      toast.success(data.status === "suspended" ? "Utilisateur suspendu" : "Utilisateur activé");
    },
  });

  // Mutation for deletion
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
      
      await logAction("user_deleted", { user_id: userId });
      return userId;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const previousUsers = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) =>
        old?.filter((u) => u.user_id !== userId)
      );
      
      return { previousUsers };
    },
    onError: (_, __, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["admin-users"], context.previousUsers);
      }
      toast.error("Erreur lors de la suppression");
    },
    onSuccess: () => {
      toast.success("Utilisateur supprimé");
    },
  });

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(term) ||
        user.full_name?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      suspended: "destructive",
    };
    const labels: Record<string, string> = {
      active: "Actif",
      suspended: "Suspendu",
    };
    return <Badge variant={variants[status || "active"] || "secondary"}>{labels[status || "active"] || status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500 hover:bg-red-600 text-white",
      moderator: "bg-blue-500 hover:bg-blue-600 text-white",
      user: "bg-green-500 hover:bg-green-600 text-white",
    };
    const labels: Record<string, string> = {
      admin: "Admin",
      moderator: "Modérateur",
      user: "Utilisateur",
    };
    return (
      <Badge className={colors[role] || "bg-gray-500 text-white"}>
        <Shield className="h-3 w-3 mr-1" />
        {labels[role] || role}
      </Badge>
    );
  };

  const handleDelete = (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?")) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des utilisateurs
          </CardTitle>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Role Legend */}
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <span className="text-muted-foreground">Légende:</span>
          {getRoleBadge("admin")}
          {getRoleBadge("moderator")}
          {getRoleBadge("user")}
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="hidden sm:table-cell">Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Connexions</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.full_name || "-"}</TableCell>
                    <TableCell>{getRoleBadge(user.role || "user")}</TableCell>
                    <TableCell className="hidden sm:table-cell">{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{user.login_count || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="h-4 w-4 mr-2" />
                              Changer le rôle
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {(["admin", "moderator", "user"] as const).map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => changeRoleMutation.mutate({ userId: user.user_id, newRole: role })}
                                  disabled={user.role === role || changeRoleMutation.isPending}
                                >
                                  {getRoleBadge(role)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />

                          {user.status === "active" ? (
                            <DropdownMenuItem 
                              onClick={() => statusMutation.mutate({ userId: user.user_id, status: "suspended" })}
                              disabled={statusMutation.isPending}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspendre
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => statusMutation.mutate({ userId: user.user_id, status: "active" })}
                              disabled={statusMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activer
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleDelete(user.user_id)}
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

        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} utilisateur(s) sur {users.length}
        </p>
      </CardContent>
    </Card>
  );
}
