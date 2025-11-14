import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useSystemLogs } from "./useSystemLogs";

export const useScanHistory = (equipmentId?: string) => {
  const queryClient = useQueryClient();
  const { logAction } = useSystemLogs();

  // Fetch scan history for specific equipment
  const { data: scanHistory = [], isLoading } = useQuery({
    queryKey: ["scanHistory", equipmentId],
    queryFn: async () => {
      if (!equipmentId) return [];

      const { data, error } = await (supabase as any)
        .from("scan_history")
        .select(`
          *,
          profiles:user_id (email, full_name)
        `)
        .eq("equipment_id", equipmentId)
        .order("scanned_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!equipmentId,
  });

  // Check if user has already scanned this equipment
  const checkDuplicateScan = async (
    equipmentId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<boolean> => {
    if (isAdmin) return false; // Admins can scan multiple times

    try {
      const { data, error } = await (supabase as any)
        .from("scan_history")
        .select("id")
        .eq("equipment_id", equipmentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return !!data; // Return true if scan exists
    } catch (error) {
      console.error("Error checking duplicate scan:", error);
      return false;
    }
  };

  // Add scan record
  const addScan = useMutation({
    mutationFn: async ({
      equipmentId,
      userId,
      notes,
      isAdmin,
    }: {
      equipmentId: string;
      userId: string;
      notes?: string;
      isAdmin: boolean;
    }) => {
      // Check for duplicate scan
      const isDuplicate = await checkDuplicateScan(equipmentId, userId, isAdmin);
      
      if (isDuplicate) {
        throw new Error("DUPLICATE_SCAN");
      }

      const { data, error } = await (supabase as any)
        .from("scan_history")
        .insert({
          equipment_id: equipmentId,
          user_id: userId,
          scanner_notes: notes,
          action: "scan",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
      logAction("equipment_scanned", { equipment_id: variables.equipmentId });
      toast({
        title: "Scan enregistré",
        description: "Le scan a été enregistré avec succès.",
      });
    },
    onError: (error: Error) => {
      if (error.message === "DUPLICATE_SCAN") {
        toast({
          title: "Scan déjà effectué",
          description: "Vous avez déjà scanné ce matériel. Seuls les administrateurs peuvent scanner plusieurs fois.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer le scan.",
          variant: "destructive",
        });
      }
    },
  });

  return {
    scanHistory,
    isLoading,
    addScan: addScan.mutate,
    checkDuplicateScan,
  };
};
