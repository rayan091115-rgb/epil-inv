import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyStatePanel, MetricCard, SectionPanel } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Button } from "@/components/ui/button";
import { Equipment } from "@/types/equipment";

interface DashboardProps {
  equipment: Equipment[];
  isLoading?: boolean;
  onAddEquipment?: () => void;
}

const CHART_COLORS = {
  OK: "hsl(160 84% 30%)",
  Panne: "hsl(35 92% 42%)",
  HS: "hsl(356 72% 46%)",
};

const MinimalTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-border/70 bg-card px-3 py-2 shadow-[0_16px_40px_rgba(16,24,40,0.08)]">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs text-muted-foreground">
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="glass-skeleton h-36 w-full" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {[...Array(3)].map((_, index) => (
        <div key={index} className={`glass-skeleton h-80 w-full ${index === 2 ? "xl:col-span-2" : ""}`} />
      ))}
    </div>
  </div>
);

export const Dashboard = memo(({ equipment, isLoading, onAddEquipment }: DashboardProps) => {
  const stats = useMemo(() => {
    const total = equipment.length;
    const ok = equipment.filter((item) => item.etat === "OK").length;
    const panne = equipment.filter((item) => item.etat === "Panne").length;
    const hs = equipment.filter((item) => item.etat === "HS").length;
    const okPercent = total ? ((ok / total) * 100).toFixed(1) : "0";

    return { total, ok, panne, hs, okPercent };
  }, [equipment]);

  const statusData = useMemo(
    () =>
      [
        { name: "OK", value: stats.ok, color: CHART_COLORS.OK },
        { name: "Panne", value: stats.panne, color: CHART_COLORS.Panne },
        { name: "HS", value: stats.hs, color: CHART_COLORS.HS },
      ].filter((item) => item.value > 0),
    [stats],
  );

  const categoryData = useMemo(
    () =>
      Object.entries(
        equipment.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      )
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    [equipment],
  );

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { month: string; count: number }[] = [];

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = equipment.filter((item) => {
        const created = new Date(item.createdAt);
        return created >= startOfMonth && created <= endOfMonth;
      }).length;

      months.push({
        month: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
        count,
      });
    }

    return months;
  }, [equipment]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (equipment.length === 0) {
    return (
      <EmptyStatePanel
        icon={Icons.cube}
        title="Aucun equipement"
        description="Ajoutez du materiel pour alimenter le tableau de bord, les graphiques et les outils de verification."
        action={
          onAddEquipment ? (
            <Button onClick={onAddEquipment}>
              <Icons.plus className="h-[18px] w-[18px]" />
              Ajouter un equipement
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Parc total" value={stats.total} icon={Icons.cube} description="Equipements suivis" />
        <MetricCard
          title="En service"
          value={stats.ok}
          icon={Icons.check}
          tone="success"
          description={`${stats.okPercent}% du parc exploitable`}
        />
        <MetricCard title="En panne" value={stats.panne} icon={Icons.warning} tone="warning" description="Actions a planifier" />
        <MetricCard title="Hors service" value={stats.hs} icon={Icons.close} tone="danger" description="A remplacer" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionPanel title="Etat du parc" description="Lecture immediate de la repartition par statut.">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<MinimalTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-3">
              {statusData.map((item) => (
                <div key={item.name} className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionPanel>

        <SectionPanel title="Categories principales" description="Top 8 des familles d equipements les plus presentes.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Tooltip content={<MinimalTooltip />} />
                <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[0, 8, 8, 0]} name="Quantite" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>

        <SectionPanel
          className="xl:col-span-2"
          title="Evolution du parc"
          description="Nouveaux equipements ajoutes sur les 6 derniers mois."
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip content={<MinimalTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2.4}
                  fill="url(#dashboardArea)"
                  name="Equipements"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";
