import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSystemLogs } from "./useSystemLogs";

interface ScanHistoryItem {
  id: string;
  equipment_id: string | null;
  scanned_at: string;
  scanner_notes: string | null;
}

export const useScanHistory = (equipmentId?: string) => {
  const queryClient = useQueryClient();
  const { logAction } = useSystemLogs();

  // Fetch scan history for specific equipment
  const { data: scanHistory = [], isLoading } = useQuery({
    queryKey: ["scanHistory", equipmentId],
    queryFn: async (): Promise<ScanHistoryItem[]> => {
      if (!equipmentId) return [];

      const { data, error } = await supabase
        .from("scan_history")
        .select("id, equipment_id, scanned_at, scanner_notes")
        .eq("equipment_id", equipmentId)
        .order("scanned_at", { ascending: false });

      if (error) {
        console.error("[ScanHistory] Fetch error:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!equipmentId,
    staleTime: 30000,
  });

  // Add scan record
  const addScan = useMutation({
    mutationFn: async ({
      equipmentId,
      notes,
    }: {
      equipmentId: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("scan_history")
        .insert({
          equipment_id: equipmentId,
          scanner_notes: notes,
        })
        .select()
        .single();

      if (error) {
        console.error("[ScanHistory] Insert error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
      logAction("equipment_scanned", { equipment_id: variables.equipmentId });
      toast.success("Scan enregistré avec succès");
    },
    onError: (error: Error) => {
      console.error("[ScanHistory] Add scan error:", error);
      toast.error("Impossible d'enregistrer le scan");
    },
  });

  return {
    scanHistory,
    isLoading,
    addScan: addScan.mutate,
  };
};
