import { useEffect, useState } from "react";
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
import { MoreVertical, Search, RefreshCw, Shield, UserCog, Ban, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSystemLogs } from "@/hooks/useSystemLogs";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  status: string;
  last_login: string;
  login_count: number;
  created_at: string;
  role?: "admin" | "moderator" | "user";
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const { logAction } = useSystemLogs();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .order("role", { ascending: true })
            .limit(1)
            .maybeSingle();

          return {
            ...profile,
            role: (roleData?.role as "admin" | "moderator" | "user") || "user",
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des utilisateurs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChangeRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    setUpdatingRole(userId);
    try {
      // First, check if user has a role entry
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      await logAction("role_changed", { user_id: userId, new_role: newRole });
      toast.success(`Rôle changé en ${newRole}`);
      loadUsers();
    } catch (error: any) {
      toast.error("Erreur lors du changement de rôle");
      console.error(error);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "suspended" })
        .eq("user_id", userId);

      if (error) throw error;

      await logAction("user_suspended", { user_id: userId });
      toast.success("Utilisateur suspendu");
      loadUsers();
    } catch (error: any) {
      toast.error("Erreur lors de la suspension");
      console.error(error);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("user_id", userId);

      if (error) throw error;

      await logAction("user_activated", { user_id: userId });
      toast.success("Utilisateur activé");
      loadUsers();
    } catch (error: any) {
      toast.error("Erreur lors de l'activation");
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible.")) return;

    try {
      // Delete from profiles first (cascade should handle user_roles)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (profileError) throw profileError;

      await logAction("user_deleted", { user_id: userId });
      toast.success("Utilisateur supprimé");
      loadUsers();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      suspended: "destructive",
      deleted: "secondary",
    };
    const labels: Record<string, string> = {
      active: "Actif",
      suspended: "Suspendu",
      deleted: "Supprimé",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500 hover:bg-red-600 text-white",
      moderator: "bg-blue-500 hover:bg-blue-600 text-white",
      user: "bg-green-500 hover:bg-green-600 text-white",
    };
    const labels: Record<string, string> = {
      admin: "Administrateur",
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gestion des utilisateurs et rôles
          </CardTitle>
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Role Legend */}
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground mr-2">Légende des rôles :</span>
          <Badge className="bg-red-500 text-white"><Shield className="h-3 w-3 mr-1" />Admin - Accès total</Badge>
          <Badge className="bg-blue-500 text-white"><Shield className="h-3 w-3 mr-1" />Modérateur - Création/Édition</Badge>
          <Badge className="bg-green-500 text-white"><Shield className="h-3 w-3 mr-1" />Utilisateur - Lecture seule</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Connexions</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || "-"}</TableCell>
                      <TableCell>
                        {updatingRole === user.user_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : (
                          getRoleBadge(user.role || "user")
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{user.login_count || 0}</TableCell>
                      <TableCell>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit", 
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Jamais"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
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
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(user.user_id, "admin")}
                                  disabled={user.role === "admin"}
                                >
                                  <Badge className="bg-red-500 text-white mr-2">Admin</Badge>
                                  Administrateur
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(user.user_id, "moderator")}
                                  disabled={user.role === "moderator"}
                                >
                                  <Badge className="bg-blue-500 text-white mr-2">Mod</Badge>
                                  Modérateur
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(user.user_id, "user")}
                                  disabled={user.role === "user"}
                                >
                                  <Badge className="bg-green-500 text-white mr-2">User</Badge>
                                  Utilisateur
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            
                            <DropdownMenuSeparator />
                            
                            {user.status === "active" ? (
                              <DropdownMenuItem onClick={() => handleSuspendUser(user.user_id)}>
                                <Ban className="h-4 w-4 mr-2" />
                                Suspendre
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivateUser(user.user_id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activer
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.user_id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer définitivement
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
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Total : {filteredUsers.length} utilisateur(s)
        </div>
      </CardContent>
    </Card>
  );
}
