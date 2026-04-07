import { useEffect, useState } from "react";

import { MetricCard } from "@/components/app/primitives";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Icons } from "@/components/app/icons";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  todayActions: number;
  adminCount: number;
}

export default function AdminStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    todayActions: 0,
    adminCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayActions } = await supabase
        .from("system_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      const { count: adminCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        todayActions: todayActions || 0,
        adminCount: adminCount || 0,
      });
    } catch (error) {
      toast.error("Erreur lors du chargement des statistiques");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="glass-skeleton h-36 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Utilisateurs" value={stats.totalUsers} icon={Icons.users} description="Profils enregistres" />
      <MetricCard title="Actifs" value={stats.activeUsers} icon={Icons.activity} description="Profils actuellement actifs" tone="success" />
      <MetricCard title="Actions du jour" value={stats.todayActions} icon={Icons.history} description="Evenements depuis minuit" />
      <MetricCard title="Administrateurs" value={stats.adminCount} icon={Icons.admin} description="Comptes a privilege eleve" tone="warning" />
    </div>
  );
}
