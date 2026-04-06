import { memo, useMemo } from "react";
import { Equipment } from "@/types/equipment";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Package, AlertCircle, CheckCircle, AlertTriangle,
  TrendingUp, Activity, Plus,
} from "lucide-react";

interface DashboardProps {
  equipment: Equipment[];
  isLoading?: boolean;
  onAddEquipment?: () => void;
}

// ── Linear Light palette for charts ──────────────────────────────────────────
const STATUS_COLORS = {
  OK:    "#27a644",
  Panne: "#f79009",
  HS:    "#e5484d",
};

const LN = {
  brand:   "#5e6ad2",
  text:    "#1a1a1e",
  muted:   "#8a8f98",
  border:  "#e6e6e6",
  surface: "#ffffff",
  page:    "#f7f8f8",
  panel:   "#f3f4f5",
};

// ── Premium Tooltip ───────────────────────────────────────────────────────────
const LinearTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e6e6e6",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 12px",
        fontFamily: "Inter, sans-serif",
        fontFeatureSettings: '"cv01" 1, "ss03" 1',
      }}
    >
      {label && (
        <p style={{ fontSize: "12px", fontWeight: 510, color: LN.muted, marginBottom: "4px", letterSpacing: "-0.13px" }}>
          {label}
        </p>
      )}
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ fontSize: "13px", fontWeight: 590, color: LN.text, letterSpacing: "-0.13px" }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

// ── KPI Stat Card ─────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  accent?: string;
  accentBg?: string;
  index?: number;
}

const StatCard = memo(({ title, value, description, icon: Icon, accent = LN.brand, accentBg = "rgba(94,106,210,0.08)", index = 0 }: StatCardProps) => (
  <div
    className="ln-stat-card animate-fade-in"
    style={{ animationDelay: `${index * 0.06}s` }}
  >
    <div className="flex items-start justify-between">
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "12px", fontWeight: 510, color: LN.muted, letterSpacing: "-0.13px", marginBottom: "8px" }}>
          {title}
        </p>
        <p style={{ fontSize: "28px", fontWeight: 590, color: LN.text, letterSpacing: "-0.56px", lineHeight: 1.1, marginBottom: "6px" }}>
          {value}
        </p>
        <p style={{ fontSize: "12px", color: LN.muted, letterSpacing: "-0.13px" }}>
          {description}
        </p>
      </div>
      <div
        className="flex items-center justify-center rounded-lg"
        style={{ width: "36px", height: "36px", background: accentBg, flexShrink: 0, marginLeft: "16px" }}
      >
        <Icon style={{ width: "16px", height: "16px", color: accent }} />
      </div>
    </div>
  </div>
));
StatCard.displayName = "StatCard";

// ── Chart Section Header ──────────────────────────────────────────────────────
const ChartHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-5">
    <Icon style={{ width: "14px", height: "14px", color: LN.muted }} />
    <span style={{ fontSize: "13px", fontWeight: 510, color: LN.text, letterSpacing: "-0.182px" }}>
      {title}
    </span>
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd?: () => void }) => (
  <div
    className="flex flex-col items-center justify-center animate-fade-in"
    style={{ padding: "80px 32px", textAlign: "center" }}
  >
    <div
      className="flex items-center justify-center rounded-full mb-5"
      style={{ width: "56px", height: "56px", background: LN.panel, border: "1px solid #e6e6e6" }}
    >
      <Package style={{ width: "24px", height: "24px", color: LN.muted }} />
    </div>
    <h3 style={{ fontSize: "16px", fontWeight: 590, color: LN.text, letterSpacing: "-0.24px", marginBottom: "8px" }}>
      Aucun équipement
    </h3>
    <p style={{ fontSize: "14px", color: LN.muted, maxWidth: "360px", lineHeight: 1.6, marginBottom: "24px", letterSpacing: "-0.13px" }}>
      Le tableau de bord affichera les statistiques une fois que vous aurez ajouté des équipements.
    </p>
    {onAdd && (
      <button onClick={onAdd} className="ln-btn-primary" style={{ padding: "9px 18px", fontSize: "14px" }}>
        <Plus style={{ width: "14px", height: "14px" }} />
        Ajouter un équipement
      </button>
    )}
  </div>
);

// ── Skeleton Loader ───────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg"
          style={{ height: "104px", background: "#f0f0f0", border: "1px solid #e6e6e6" }}
        />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg ${i === 2 ? "lg:col-span-2" : ""}`}
          style={{ height: "280px", background: "#f0f0f0", border: "1px solid #e6e6e6" }}
        />
      ))}
    </div>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
export const Dashboard = memo(({ equipment, isLoading, onAddEquipment }: DashboardProps) => {
  const stats = useMemo(() => {
    const total = equipment.length;
    const ok    = equipment.filter((e) => e.etat === "OK").length;
    const panne = equipment.filter((e) => e.etat === "Panne").length;
    const hs    = equipment.filter((e) => e.etat === "HS").length;
    const okPercent = total ? ((ok / total) * 100).toFixed(1) : "0";
    return { total, ok, panne, hs, okPercent };
  }, [equipment]);

  const statusData = useMemo(() =>
    [
      { name: "OK",    value: stats.ok,    color: STATUS_COLORS.OK },
      { name: "Panne", value: stats.panne, color: STATUS_COLORS.Panne },
      { name: "HS",    value: stats.hs,    color: STATUS_COLORS.HS },
    ].filter((d) => d.value > 0),
    [stats]
  );

  const categoryData = useMemo(() =>
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
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end   = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const count = equipment.filter((e) => {
        const d = new Date(e.createdAt);
        return d >= start && d <= end;
      }).length;
      months.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), count });
    }
    return months;
  }, [equipment]);

  if (isLoading) return <DashboardSkeleton />;
  if (equipment.length === 0) return <EmptyState onAdd={onAddEquipment} />;

  const cardStyle = {
    background: LN.surface,
    border: `1px solid ${LN.border}`,
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 4px 0px",
  };

  const axisStyle = { fill: LN.muted, fontSize: 11, fontFamily: "Inter, sans-serif" };
  const gridColor = "#f0f0f0";

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard
          index={0}
          title="Total équipements"
          value={stats.total}
          icon={Package}
          description="Parc complet"
          accent="#5e6ad2"
          accentBg="rgba(94,106,210,0.08)"
        />
        <StatCard
          index={1}
          title="En service"
          value={stats.ok}
          icon={CheckCircle}
          description={`${stats.okPercent}% du parc`}
          accent="#27a644"
          accentBg="rgba(39,166,68,0.08)"
        />
        <StatCard
          index={2}
          title="En panne"
          value={stats.panne}
          icon={AlertTriangle}
          description="À réparer"
          accent="#f79009"
          accentBg="rgba(247,144,9,0.08)"
        />
        <StatCard
          index={3}
          title="Hors service"
          value={stats.hs}
          icon={AlertCircle}
          description="À remplacer"
          accent="#e5484d"
          accentBg="rgba(229,72,77,0.08)"
        />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Donut — Status */}
        <div style={cardStyle}>
          <ChartHeader icon={Activity} title="Répartition par état" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {statusData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<LinearTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: LN.muted, letterSpacing: "-0.13px", fontWeight: 510 }}>
                  {item.name} · {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar — Category */}
        <div style={cardStyle}>
          <ChartHeader icon={Package} title="Par catégorie" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="0" horizontal={false} vertical={true} stroke={gridColor} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={80} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<LinearTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="count" fill={LN.brand} radius={[0, 4, 4, 0]} name="Quantité" maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area — Monthly trend */}
        <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
          <ChartHeader icon={TrendingUp} title="Évolution du parc (6 derniers mois)" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ left: 0, right: 8 }}>
              <defs>
                <linearGradient id="gradBrand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={LN.brand} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={LN.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<LinearTooltip />} cursor={{ stroke: LN.border, strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={LN.brand}
                strokeWidth={1.5}
                fill="url(#gradBrand)"
                name="Équipements"
                dot={{ fill: LN.brand, strokeWidth: 0, r: 3 }}
                activeDot={{ fill: LN.brand, strokeWidth: 2, stroke: "#fff", r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";