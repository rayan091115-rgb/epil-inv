import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Activity, Shield, Settings, BarChart3, FileText, ArrowLeft } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import AdminUsersOptimized from "./AdminUsersOptimized";
import AdminLogs from "./AdminLogs";
import AdminRoles from "./AdminRoles";
import AdminStats from "./AdminStats";
import AdminSettings from "./AdminSettings";
import AdminActivity from "./AdminActivity";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
            <p className="text-muted-foreground">Gestion complète du système</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiques</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Rôles</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activité</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
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
}