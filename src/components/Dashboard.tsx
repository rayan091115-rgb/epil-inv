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
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  equipment: Equipment[];
}

// Glass Stat Card Component
const GlassStatCard = memo(
  ({
    title,
    value,
    icon: Icon,
    description,
    variant = "default",
  }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    description: string;
    variant?: "default" | "success" | "warning" | "danger";
  }) => {
    const variantStyles = {
      default: "glow-blue",
      success: "glow-green",
      warning: "glow-yellow",
      danger: "glow-red",
    };

    const iconColors = {
      default: "text-primary",
      success: "text-success",
      warning: "text-warning",
      danger: "text-destructive",
    };

    const bgColors = {
      default: "bg-primary/10",
      success: "bg-success/10",
      warning: "bg-warning/10",
      danger: "bg-destructive/10",
    };

    return (
      <Card className={`${variantStyles[variant]} relative overflow-hidden`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className={`text-3xl font-bold ${iconColors[variant]}`}>
                {value}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className={`p-3 rounded-xl ${bgColors[variant]}`}>
              <Icon className={`h-6 w-6 ${iconColors[variant]}`} />
            </div>
          </div>
          {/* Decorative gradient overlay */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl" />
        </CardContent>
      </Card>
    );
  }
);

GlassStatCard.displayName = "GlassStatCard";

// Custom Tooltip for Charts
const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card px-4 py-3 min-w-[120px]">
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs text-muted-foreground">
          {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// Loading Skeleton
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-skeleton h-32 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`glass-skeleton h-80 rounded-2xl ${i === 2 ? "lg:col-span-2" : ""}`}
        />
      ))}
    </div>
  </div>
);

export const Dashboard = memo(({ equipment }: DashboardProps) => {
  // Memoized calculations for performance
  const stats = useMemo(() => {
    const total = equipment.length;
    const ok = equipment.filter((e) => e.etat === "OK").length;
    const panne = equipment.filter((e) => e.etat === "Panne").length;
    const hs = equipment.filter((e) => e.etat === "HS").length;
    const okPercent = total ? ((ok / total) * 100).toFixed(1) : "0";

    return { total, ok, panne, hs, okPercent };
  }, [equipment]);

  // Status distribution for pie chart
  const statusData = useMemo(
    () =>
      [
        { name: "OK", value: stats.ok, color: "hsl(var(--success))" },
        { name: "Panne", value: stats.panne, color: "hsl(var(--warning))" },
        { name: "HS", value: stats.hs, color: "hsl(var(--destructive))" },
      ].filter((item) => item.value > 0),
    [stats]
  );

  // Category distribution for bar chart
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

  // Real monthly trend based on created_at dates
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
    <div className="space-y-8 animate-fade-in">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <GlassStatCard
          title="Total Équipements"
          value={stats.total}
          icon={Package}
          description="Inventaire complet"
          variant="default"
        />
        <GlassStatCard
          title="En Bon État"
          value={stats.ok}
          icon={CheckCircle}
          description={`${stats.okPercent}% du parc`}
          variant="success"
        />
        <GlassStatCard
          title="En Panne"
          value={stats.panne}
          icon={AlertTriangle}
          description="Nécessite maintenance"
          variant="warning"
        />
        <GlassStatCard
          title="Hors Service"
          value={stats.hs}
          icon={AlertCircle}
          description="À remplacer"
          variant="danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card className="chart-glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Répartition par État
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Bar Chart */}
        <Card className="chart-glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Équipements par Catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="hsl(var(--border) / 0.5)"
                />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip content={<GlassTooltip />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[0, 8, 8, 0]}
                  name="Quantité"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend Area Chart */}
        <Card className="chart-glass lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Évolution du Parc Informatique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border) / 0.5)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<GlassTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
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
