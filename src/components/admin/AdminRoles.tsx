import { useEffect, useState } from "react";

import { SectionPanel } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
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
    } catch (error) {
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
    const className = role === "admin" ? "status-danger" : role === "moderator" ? "status-warning" : "status-ok";
    return (
      <Badge variant="outline" className={className}>
        {role}
      </Badge>
    );
  };

  const PermissionIcon = ({ granted }: { granted: boolean }) => {
    if (granted) return <Icons.check className="mx-auto h-[18px] w-[18px] text-emerald-600" />;
    return <Icons.close className="mx-auto h-[18px] w-[18px] text-muted-foreground" />;
  };

  return (
    <SectionPanel title="Roles et permissions" description="Vue de lecture des droits par ressource et par role.">
      <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card">
        {loading ? (
          <div className="p-6">
            <div className="glass-skeleton h-72 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead className="text-center">Lecture</TableHead>
                <TableHead className="text-center">Creation</TableHead>
                <TableHead className="text-center">Modification</TableHead>
                <TableHead className="text-center">Suppression</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Aucune permission trouvee.
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>{getRoleBadge(permission.role)}</TableCell>
                    <TableCell className="font-medium">{permission.resource}</TableCell>
                    <TableCell className="text-center"><PermissionIcon granted={permission.can_read} /></TableCell>
                    <TableCell className="text-center"><PermissionIcon granted={permission.can_create} /></TableCell>
                    <TableCell className="text-center"><PermissionIcon granted={permission.can_update} /></TableCell>
                    <TableCell className="text-center"><PermissionIcon granted={permission.can_delete} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </SectionPanel>
  );
}
