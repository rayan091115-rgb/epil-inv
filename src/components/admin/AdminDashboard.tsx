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

      <Tabs defaultValue="users" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList 
            className="ln-tabs"
            style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "4px", display: "flex", gap: "2px" }}
          >
            <TabsTrigger value="users" className="ln-tab" style={{ gap: "6px" }}>
              <Users className="h-4 w-4" />
              Utilisateurs (7)
            </TabsTrigger>
            <TabsTrigger value="logs" className="ln-tab" style={{ gap: "6px" }}>
              <FileText className="h-4 w-4" />
              Logs (200)
            </TabsTrigger>
            <TabsTrigger value="stats" className="ln-tab" style={{ gap: "6px" }}>
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="roles" className="ln-tab" style={{ gap: "6px" }}>
              <Shield className="h-4 w-4" />
              Rôles
            </TabsTrigger>
            <TabsTrigger value="activity" className="ln-tab" style={{ gap: "6px" }}>
              <Activity className="h-4 w-4" />
              Activité
            </TabsTrigger>
            <TabsTrigger value="settings" className="ln-tab" style={{ gap: "6px" }}>
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <button 
              className="ln-btn-ghost"
              style={{ border: "1px solid #e6e6e6", borderRadius: "6px", padding: "8px 12px" }}
              onClick={() => window.location.reload()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
            </button>
          </div>
        </div>

        <TabsContent value="users">
          <AdminUsersOptimized />
        </TabsContent>

        <TabsContent value="logs">
          <AdminLogs />
        </TabsContent>

        <TabsContent value="stats">
          <AdminStats />
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