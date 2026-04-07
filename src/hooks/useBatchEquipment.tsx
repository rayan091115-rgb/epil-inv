import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types/equipment";
import { toast } from "sonner";
import { qrGenerator } from "@/lib/qr-generator";

const BATCH_SIZE = 50; // Maximum items per batch insert

interface BatchResult {
  success: number;
  failed: number;
  errors: string[];
}

export const useBatchEquipment = () => {
  const queryClient = useQueryClient();

  // Helper to normalize text fields
  const normalizeText = (v?: string) =>
    v && v.trim() !== "" ? v.trim() : null;

  const normalizeDate = (v?: string) =>
    v && v.trim() !== "" ? v.trim() : null;

  // Batch import mutation - uses bulk insert instead of loop
  const batchImport = useMutation({
    mutationFn: async (items: Partial<Equipment>[]): Promise<BatchResult> => {
      const result: BatchResult = { success: 0, failed: 0, errors: [] };
      
      // Filter valid items
      const validItems = items.filter((item, index) => {
        if (!item.poste || item.poste.trim() === "") {
          result.failed++;
          result.errors.push(`Ligne ${index + 2}: poste vide`);
          return false;
        }
        return true;
      });

      if (validItems.length === 0) {
        return result;
      }

      // Generate QR codes for all items at once (optimized)
      const preparedItems = await Promise.all(
        validItems.map(async (data) => {
          const tempId = crypto.randomUUID();
          const qrCode = await qrGenerator.generate(tempId);
          
          return {
            id: tempId,
            poste: data.poste,
            category: data.category || "PC",
            marque: normalizeText(data.marque),
            modele: normalizeText(data.modele),
            numero_serie: normalizeText(data.numeroSerie),
            etat: (data.etat || "OK") as Equipment["etat"],
            date_achat: normalizeDate(data.dateAchat),
            fin_garantie: normalizeDate(data.finGarantie),
            notes: normalizeText(data.notes),
            qr_code: qrCode,
            processeur: normalizeText(data.processeur),
            ram: normalizeText(data.ram),
            capacite_dd: normalizeText(data.capaciteDd),
            alimentation: data.alimentation ?? true,
            os: normalizeText(data.os),
            adresse_mac: normalizeText(data.adresseMac),
          };
        })
      );

      // Insert in batches to avoid hitting limits
      for (let i = 0; i < preparedItems.length; i += BATCH_SIZE) {
        const batch = preparedItems.slice(i, i + BATCH_SIZE);
        
        try {
          const { error } = await supabase
            .from("equipment")
            .insert(batch);

          if (error) {
            result.failed += batch.length;
            result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
          } else {
            result.success += batch.length;
          }
        } catch (err: any) {
          result.failed += batch.length;
          result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      
      if (result.failed === 0) {
        toast.success(`Import réussi: ${result.success} équipement(s) importé(s)`);
      } else if (result.success > 0) {
        toast.warning(`Import partiel: ${result.success} réussi(s), ${result.failed} en erreur`);
      } else {
        toast.error("Échec de l'import: aucun équipement importé");
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'import: ${error.message}`);
    },
  });

  // Batch delete mutation - uses IN operator instead of loop
  const batchDelete = useMutation({
    mutationFn: async (ids: string[]): Promise<BatchResult> => {
      const result: BatchResult = { success: 0, failed: 0, errors: [] };

      // Delete in batches
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        
        try {
          const { error, count } = await supabase
            .from("equipment")
            .delete()
            .in("id", batch);

          if (error) {
            result.failed += batch.length;
            result.errors.push(error.message);
          } else {
            result.success += count || batch.length;
          }
        } catch (err: any) {
          result.failed += batch.length;
          result.errors.push(err.message);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      
      if (result.failed === 0) {
        toast.success(`${result.success} équipement(s) supprimé(s)`);
      } else {
        toast.warning(`${result.success} supprimé(s), ${result.failed} en erreur`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur de suppression: ${error.message}`);
    },
  });

  return {
    batchImport: batchImport.mutateAsync,
    batchDelete: batchDelete.mutateAsync,
    isImporting: batchImport.isPending,
    isDeleting: batchDelete.isPending,
  };
};
