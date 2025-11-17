import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: string;
  role: string;
  resource: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export default function AdminRoles() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("role", { ascending: true })
        .order("resource", { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des permissions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500 text-white",
      moderator: "bg-blue-500 text-white",
      user: "bg-green-500 text-white",
    };
    return (
      <Badge className={colors[role] || "bg-gray-500 text-white"}>
        <Shield className="h-3 w-3 mr-1" />
        {role}
      </Badge>
    );
  };

  const PermissionIcon = ({ granted }: { granted: boolean }) => {
    return granted ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-gray-300" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rôles et permissions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Ressource</TableHead>
                  <TableHead className="text-center">Lecture</TableHead>
                  <TableHead className="text-center">Création</TableHead>
                  <TableHead className="text-center">Modification</TableHead>
                  <TableHead className="text-center">Suppression</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucune permission trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>{getRoleBadge(permission.role)}</TableCell>
                      <TableCell className="font-medium">
                        {permission.resource}
                      </TableCell>
                      <TableCell className="text-center">
                        <PermissionIcon granted={permission.can_read} />
                      </TableCell>
                      <TableCell className="text-center">
                        <PermissionIcon granted={permission.can_create} />
                      </TableCell>
                      <TableCell className="text-center">
                        <PermissionIcon granted={permission.can_update} />
                      </TableCell>
                      <TableCell className="text-center">
                        <PermissionIcon granted={permission.can_delete} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}