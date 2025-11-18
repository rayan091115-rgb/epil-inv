import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface MaintenanceLog {
  id: string;
  equipment_id: string;
  user_id: string;
  report_date: string;
  description_probleme: string;
  actions_effectuees?: string;
  status: "ouvert" | "en_cours" | "resolu" | "ferme";
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export const useMaintenanceLogs = (equipmentId?: string) => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["maintenance_logs", equipmentId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("maintenance_logs")
        .select("*, profiles!maintenance_logs_user_id_fkey(full_name, email)")
        .order("report_date", { ascending: false });

      if (equipmentId) {
        query = query.eq("equipment_id", equipmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaintenanceLog[];
    },
    enabled: !!equipmentId,
  });

  const addLog = useMutation({
    mutationFn: async (log: {
      equipment_id: string;
      description_probleme: string;
      actions_effectuees?: string;
      status?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from("maintenance_logs").insert({
        ...log,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_logs"] });
      toast({ title: "Rapport de maintenance ajouté" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaintenanceLog> & { id: string }) => {
      const { error } = await supabase
        .from("maintenance_logs")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_logs"] });
      toast({ title: "Rapport mis à jour" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { logs, isLoading, addLog, updateLog };
};
