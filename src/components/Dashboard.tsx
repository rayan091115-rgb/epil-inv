import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Equipment } from "@/types/equipment";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Package,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";

interface DashboardProps {
  equipment: Equipment[];
}

// Monochrome colors
const MONO_COLORS = {
  OK: 'hsl(0, 0%, 20%)',
  Panne: 'hsl(0, 0%, 50%)',
  HS: 'hsl(0, 0%, 70%)',
};

// Minimal Tooltip
const MinimalTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card px-3 py-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs text-muted-foreground">
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// Minimal Stat Card
const StatCard = memo(
  ({
    title,
    value,
    icon: Icon,
    description,
  }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    description: string;
  }) => {
    return (
      <Card className="glass-card-hover">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

// Loading Skeleton
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-skeleton h-28 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`glass-skeleton h-72 rounded-xl ${i === 2 ? "lg:col-span-2" : ""}`}
        />
      ))}
    </div>
  </div>
);

export const Dashboard = memo(({ equipment }: DashboardProps) => {
  const stats = useMemo(() => {
    const total = equipment.length;
    const ok = equipment.filter((e) => e.etat === "OK").length;
    const panne = equipment.filter((e) => e.etat === "Panne").length;
    const hs = equipment.filter((e) => e.etat === "HS").length;
    const okPercent = total ? ((ok / total) * 100).toFixed(1) : "0";

    return { total, ok, panne, hs, okPercent };
  }, [equipment]);

  const statusData = useMemo(
    () =>
      [
        { name: "OK", value: stats.ok, color: MONO_COLORS.OK },
        { name: "Panne", value: stats.panne, color: MONO_COLORS.Panne },
        { name: "HS", value: stats.hs, color: MONO_COLORS.HS },
      ].filter((item) => item.value > 0),
    [stats]
  );

  const categoryData = useMemo(
    () =>
      Object.entries(
        equipment.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    [equipment]
  );

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("fr-FR", { month: "short" });
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = equipment.filter((e) => {
        const created = new Date(e.createdAt);
        return created <= endOfMonth;
      }).length;

      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        count,
      });
    }

    return months;
  }, [equipment]);

  if (equipment.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Package}
          description="Équipements"
        />
        <StatCard
          title="En service"
          value={stats.ok}
          icon={CheckCircle}
          description={`${stats.okPercent}% du parc`}
        />
        <StatCard
          title="En panne"
          value={stats.panne}
          icon={AlertTriangle}
          description="À réparer"
        />
        <StatCard
          title="Hors service"
          value={stats.hs}
          icon={AlertCircle}
          description="À remplacer"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <Card className="glass-card p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Répartition par état
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
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
            <div className="flex justify-center gap-6">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Bar Chart */}
        <Card className="glass-card p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Tooltip content={<MinimalTooltip />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--foreground))"
                  radius={[0, 4, 4, 0]}
                  name="Quantité"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="glass-card p-6 lg:col-span-2">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Évolution du parc
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip content={<MinimalTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                  name="Équipements"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";