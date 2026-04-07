import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { SectionPanel, SurfaceBadge } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
  user_agent: string | null;
  profiles?: { email: string | null; full_name: string | null } | null;
}

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  user_signed_in: { label: "Connexion", tone: "status-ok" },
  user_signed_out: { label: "Deconnexion", tone: "status-warning" },
  role_changed: { label: "Changement de role", tone: "status-warning" },
  user_suspended: { label: "Suspension", tone: "status-danger" },
  user_activated: { label: "Activation", tone: "status-ok" },
  user_deleted: { label: "Suppression utilisateur", tone: "status-danger" },
  equipment_created: { label: "Equipement cree", tone: "status-ok" },
  equipment_updated: { label: "Equipement modifie", tone: "status-warning" },
  equipment_deleted: { label: "Equipement supprime", tone: "status-danger" },
};

export default function AdminActivity() {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const [logsRes, profilesRes] = await Promise.all([
        supabase.from("system_logs").select("id, user_id, action, details, created_at, user_agent").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("user_id, email, full_name"),
      ]);

      if (logsRes.error) throw logsRes.error;

      const profilesMap = new Map<string, { email: string | null; full_name: string | null }>();
      (profilesRes.data || []).forEach((profile) => {
        profilesMap.set(profile.user_id, { email: profile.email, full_name: profile.full_name });
      });

      return (logsRes.data || []).map((log) => ({
        ...log,
        profiles: log.user_id ? profilesMap.get(log.user_id) || null : null,
      })) as ActivityLog[];
    },
    refetchInterval: 30000,
  });

  return (
    <SectionPanel
      title="Activite recente"
      description="50 derniers evenements systeme, mis a jour automatiquement."
      action={<SurfaceBadge>{logs.length} evenement(s)</SurfaceBadge>}
    >
      {isLoading ? (
        <div className="glass-skeleton h-[420px] w-full" />
      ) : error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          Erreur lors du chargement des logs.
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-border p-8 text-center text-muted-foreground">
          Aucune activite recente.
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {logs.map((log) => {
              const config = ACTION_LABELS[log.action] || { label: log.action, tone: "border-border bg-background text-foreground" };

              return (
                <div key={log.id} className="rounded-[22px] border border-border/70 bg-secondary/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={config.tone}>
                          {config.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.profiles?.email || log.profiles?.full_name || "Systeme"}
                        </span>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                          {JSON.stringify(log.details)}
                        </div>
                      ) : null}
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Icons.clock className="h-[18px] w-[18px]" />
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </SectionPanel>
  );
}
