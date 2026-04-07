import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { PageHeader, PageShell, SurfaceBadge } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import AdminActivity from "./AdminActivity";
import AdminLogs from "./AdminLogs";
import AdminRoles from "./AdminRoles";
import AdminSettings from "./AdminSettings";
import AdminStats from "./AdminStats";
import AdminUsersOptimized from "./AdminUsersOptimized";

interface AdminDashboardProps {
  embedded?: boolean;
}

const adminTabs = [
  { value: "stats", label: "Statistiques", icon: Icons.activity },
  { value: "users", label: "Utilisateurs", icon: Icons.users },
  { value: "logs", label: "Logs", icon: Icons.notes },
  { value: "roles", label: "Roles", icon: Icons.admin },
  { value: "activity", label: "Activite", icon: Icons.history },
  { value: "settings", label: "Parametres", icon: Icons.settings },
] as const;

const AdminDashboard = ({ embedded = false }: AdminDashboardProps) => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });
  }, []);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate, roleLoading]);

  if (roleLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-foreground/15 border-t-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const content = (
    <div className="space-y-6">
      <PageHeader
        title="Espace administrateur"
        description="Vue unifiee pour la supervision du parc, des utilisateurs et de la securite."
        icon={Icons.admin}
        meta={
          <>
            <SurfaceBadge>Administration</SurfaceBadge>
            <SurfaceBadge>{embedded ? "Depuis l accueil" : "Route dediee"}</SurfaceBadge>
          </>
        }
        actions={
          !embedded ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Icons.previous className="h-[18px] w-[18px]" />
                Retour a l accueil
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-6">
          {adminTabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="min-h-[52px] gap-2">
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="stats">
          <AdminStats />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersOptimized />
        </TabsContent>
        <TabsContent value="logs">
          <AdminLogs />
        </TabsContent>
        <TabsContent value="roles">
          <AdminRoles />
        </TabsContent>
        <TabsContent value="activity">
          <AdminActivity />
        </TabsContent>
        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  );

  if (embedded) {
    return content;
  }

  return <PageShell>{content}</PageShell>;
};

export default AdminDashboard;
