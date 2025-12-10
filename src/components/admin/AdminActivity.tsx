import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, Clock, AlertCircle, LogIn, LogOut, Settings, Shield, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
  user_agent: string | null;
  profiles?: { email: string | null; full_name: string | null } | null;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  user_signed_in: { icon: LogIn, color: "text-green-500", label: "Connexion" },
  user_signed_out: { icon: LogOut, color: "text-orange-500", label: "Déconnexion" },
  role_changed: { icon: Shield, color: "text-blue-500", label: "Changement de rôle" },
  user_suspended: { icon: AlertCircle, color: "text-red-500", label: "Suspension" },
  user_activated: { icon: User, color: "text-green-500", label: "Activation" },
  user_deleted: { icon: AlertCircle, color: "text-red-500", label: "Suppression utilisateur" },
  equipment_created: { icon: Package, color: "text-blue-500", label: "Équipement créé" },
  equipment_updated: { icon: Settings, color: "text-yellow-500", label: "Équipement modifié" },
  equipment_deleted: { icon: AlertCircle, color: "text-red-500", label: "Équipement supprimé" },
};

export default function AdminActivity() {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_logs")
        .select(`
          id,
          user_id,
          action,
          details,
          created_at,
          user_agent,
          profiles:user_id (email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as unknown as ActivityLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getActionConfig = (action: string) => {
    return ACTION_CONFIG[action] || { icon: Activity, color: "text-gray-500", label: action };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activité en temps réel
          <Badge variant="secondary" className="ml-auto">
            {logs.length} événements
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Erreur lors du chargement des logs
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune activité récente
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {logs.map((log) => {
                const config = getActionConfig(log.action);
                const Icon = config.icon;
                
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{config.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {log.profiles?.email || log.profiles?.full_name || "Système"}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 rounded px-2 py-1 max-w-full overflow-x-auto">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
