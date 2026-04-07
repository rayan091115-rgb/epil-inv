import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DenseToolbar, SectionPanel, SurfaceBadge } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSystemLogs } from "@/hooks/useSystemLogs";
import { supabase } from "@/integrations/supabase/client";
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

const roleLabelMap = {
  admin: "Admin",
  moderator: "Moderateur",
  user: "Utilisateur",
} as const;

const roleClassMap = {
  admin: "status-danger",
  moderator: "status-warning",
  user: "status-ok",
} as const;

export default function AdminUsersOptimized() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { logAction } = useSystemLogs();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const roleMap = new Map<string, "admin" | "moderator" | "user">();
      rolesResult.data?.forEach((role) => {
        roleMap.set(role.user_id, role.role as "admin" | "moderator" | "user");
      });

      return (profilesResult.data || []).map((profile) => ({
        ...profile,
        role: roleMap.get(profile.user_id) || "user",
      })) as UserProfile[];
    },
    staleTime: 30000,
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "moderator" | "user" }) => {
      const { data: existingRole } = await supabase.from("user_roles").select("id").eq("user_id", userId).maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      await logAction("role_changed", { user_id: userId, new_role: newRole });
      return { userId, newRole };
    },
    onMutate: async ({ userId, newRole }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const previousUsers = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) =>
        old?.map((user) => (user.user_id === userId ? { ...user, role: newRole } : user)),
      );
      return { previousUsers };
    },
    onError: (_, __, context) => {
      if (context?.previousUsers) queryClient.setQueryData(["admin-users"], context.previousUsers);
      toast.error("Erreur lors du changement de role");
    },
    onSuccess: ({ newRole }) => {
      toast.success(`Role change en ${roleLabelMap[newRole]}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
      if (error) throw error;

      await logAction(status === "suspended" ? "user_suspended" : "user_activated", { user_id: userId });
      return { userId, status };
    },
    onMutate: async ({ userId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const previousUsers = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) =>
        old?.map((user) => (user.user_id === userId ? { ...user, status } : user)),
      );
      return { previousUsers };
    },
    onError: (_, __, context) => {
      if (context?.previousUsers) queryClient.setQueryData(["admin-users"], context.previousUsers);
      toast.error("Erreur lors du changement de statut");
    },
    onSuccess: ({ status }) => {
      toast.success(status === "suspended" ? "Utilisateur suspendu" : "Utilisateur active");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;

      await logAction("user_deleted", { user_id: userId });
      return userId;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-users"] });
      const previousUsers = queryClient.getQueryData<UserProfile[]>(["admin-users"]);
      queryClient.setQueryData<UserProfile[]>(["admin-users"], (old) => old?.filter((user) => user.user_id !== userId));
      return { previousUsers };
    },
    onError: (_, __, context) => {
      if (context?.previousUsers) queryClient.setQueryData(["admin-users"], context.previousUsers);
      toast.error("Erreur lors de la suppression");
    },
    onSuccess: () => {
      toast.success("Utilisateur supprime");
    },
  });

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) => user.email?.toLowerCase().includes(term) || user.full_name?.toLowerCase().includes(term),
    );
  }, [searchTerm, users]);

  const getRoleBadge = (role: UserProfile["role"] = "user") => (
    <Badge variant="outline" className={roleClassMap[role]}>
      {roleLabelMap[role]}
    </Badge>
  );

  const getStatusBadge = (status: string | null) => (
    <Badge variant="outline" className={status === "suspended" ? "status-danger" : "status-ok"}>
      {status === "suspended" ? "Suspendu" : "Actif"}
    </Badge>
  );

  const handleDelete = (userId: string) => {
    if (confirm("Voulez-vous supprimer definitivement cet utilisateur ?")) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <SectionPanel
      title="Gestion des utilisateurs"
      description="Recherche, roles, statut et suppression depuis une seule table."
      action={
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
          <Icons.refresh className={`h-[18px] w-[18px] ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      }
    >
      <div className="space-y-5">
        <DenseToolbar className="bg-secondary/30 shadow-none">
          <div className="relative w-full max-w-xl">
            <Icons.search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <SurfaceBadge>{filteredUsers.length} visible(s)</SurfaceBadge>
            <SurfaceBadge>{users.length} total</SurfaceBadge>
          </div>
        </DenseToolbar>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="status-danger">
            Admin
          </Badge>
          <Badge variant="outline" className="status-warning">
            Moderateur
          </Badge>
          <Badge variant="outline" className="status-ok">
            Utilisateur
          </Badge>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Nom</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Connexions</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-9 rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Aucun utilisateur trouve.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="max-w-[240px] truncate font-medium">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.full_name || "-"}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{user.login_count || 0}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions pour ${user.email}`}>
                            <Icons.more className="h-[18px] w-[18px]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Icons.admin className="mr-2 h-[18px] w-[18px]" />
                              Changer le role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {(["admin", "moderator", "user"] as const).map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => changeRoleMutation.mutate({ userId: user.user_id, newRole: role })}
                                  disabled={user.role === role || changeRoleMutation.isPending}
                                >
                                  {roleLabelMap[role]}
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
                              <Icons.warning className="mr-2 h-[18px] w-[18px]" />
                              Suspendre
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => statusMutation.mutate({ userId: user.user_id, status: "active" })}
                              disabled={statusMutation.isPending}
                            >
                              <Icons.check className="mr-2 h-[18px] w-[18px]" />
                              Reactiver
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleDelete(user.user_id)}
                            className="text-destructive focus:text-destructive"
                            disabled={deleteMutation.isPending}
                          >
                            <Icons.trash className="mr-2 h-[18px] w-[18px]" />
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
      </div>
    </SectionPanel>
  );
}
