import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types/equipment";
import { toast } from "sonner";
import { qrGenerator } from "@/lib/qr-generator";

/**
 * Hook de gestion des équipements avec TanStack Query
 * - Optimistic updates pour UX réactive
 * - Gestion d'erreur robuste sans déconnexion
 * - Retry automatique sur erreur réseau
 */
export const useEquipment = () => {
  const queryClient = useQueryClient();

  // Helper to normalize text fields
  const normalizeText = (v?: string) =>
    v && v.trim() !== "" ? v.trim() : null;

  const normalizeDate = (v?: string) =>
    v && v.trim() !== "" ? v.trim() : null;

  // Fetch all equipment with retry and stale time
  const { data: equipment = [], isLoading, error } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Equipment] Fetch error:", error);
        throw error;
      }

      return data.map((item: any) => ({
        id: item.id,
        poste: item.poste,
        category: item.category as Equipment["category"],
        marque: item.marque,
        modele: item.modele,
        numeroSerie: item.numero_serie,
        etat: item.etat as Equipment["etat"],
        dateAchat: item.date_achat,
        finGarantie: item.fin_garantie,
        notes: item.notes,
        qrCode: item.qr_code,
        processeur: item.processeur,
        ram: item.ram,
        capaciteDd: item.capacite_dd,
        alimentation: item.alimentation,
        os: item.os,
        adresseMac: item.adresse_mac,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        locationId: item.location_id,
      })) as Equipment[];
    },
    staleTime: 30000, // 30 seconds cache
    retry: 2,
    retryDelay: 1000,
  });

  // Add equipment with optimistic update
  const addEquipment = useMutation({
    mutationFn: async (data: Partial<Equipment>) => {
      const tempId = crypto.randomUUID();
      
      // Generate QR code
      const qrCode = await qrGenerator.generate(tempId);

      const insertData = {
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

      const { data: newEquipment, error } = await supabase
        .from("equipment")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("[Equipment] Add error:", error);
        throw error;
      }
      
      return newEquipment;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["equipment"] });
      
      // Snapshot previous value
      const previousEquipment = queryClient.getQueryData<Equipment[]>(["equipment"]);
      
      // Optimistically add the new equipment
      const tempEquipment: Equipment = {
        id: crypto.randomUUID(),
        poste: newData.poste || "",
        category: (newData.category || "PC") as Equipment["category"],
        marque: newData.marque || null,
        modele: newData.modele || null,
        numeroSerie: newData.numeroSerie || null,
        etat: (newData.etat || "OK") as Equipment["etat"],
        dateAchat: newData.dateAchat || null,
        finGarantie: newData.finGarantie || null,
        notes: newData.notes || null,
        qrCode: null,
        processeur: newData.processeur || null,
        ram: newData.ram || null,
        capaciteDd: newData.capaciteDd || null,
        alimentation: newData.alimentation ?? true,
        os: newData.os || null,
        adresseMac: newData.adresseMac || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Equipment[]>(["equipment"], (old) => 
        [tempEquipment, ...(old || [])]
      );
      
      return { previousEquipment };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousEquipment) {
        queryClient.setQueryData(["equipment"], context.previousEquipment);
      }
      toast.error("Erreur lors de l'ajout du matériel");
      console.error("[Equipment] Add error:", error);
    },
    onSuccess: () => {
      toast.success("Matériel ajouté avec succès");
    },
    onSettled: () => {
      // Always refetch after mutation to sync with server
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });

  // Update equipment
  const updateEquipment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Equipment> }) => {
      const updateData = {
        poste: data.poste,
        category: data.category,
        marque: normalizeText(data.marque),
        modele: normalizeText(data.modele),
        numero_serie: normalizeText(data.numeroSerie),
        etat: data.etat,
        date_achat: normalizeDate(data.dateAchat),
        fin_garantie: normalizeDate(data.finGarantie),
        notes: normalizeText(data.notes),
        processeur: normalizeText(data.processeur),
        ram: normalizeText(data.ram),
        capacite_dd: normalizeText(data.capaciteDd),
        alimentation: data.alimentation,
        os: normalizeText(data.os),
        adresse_mac: normalizeText(data.adresseMac),
      };

      const { error } = await supabase
        .from("equipment")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("[Equipment] Update error:", error);
        throw error;
      }
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["equipment"] });
      const previousEquipment = queryClient.getQueryData<Equipment[]>(["equipment"]);
      
      queryClient.setQueryData<Equipment[]>(["equipment"], (old) =>
        old?.map((eq) => (eq.id === id ? { ...eq, ...data } : eq))
      );
      
      return { previousEquipment };
    },
    onError: (error, _, context) => {
      if (context?.previousEquipment) {
        queryClient.setQueryData(["equipment"], context.previousEquipment);
      }
      toast.error("Erreur lors de la mise à jour");
      console.error("[Equipment] Update error:", error);
    },
    onSuccess: () => {
      toast.success("Matériel mis à jour");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });

  // Delete equipment
  const deleteEquipment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("equipment")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("[Equipment] Delete error:", error);
        throw error;
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["equipment"] });
      const previousEquipment = queryClient.getQueryData<Equipment[]>(["equipment"]);
      
      queryClient.setQueryData<Equipment[]>(["equipment"], (old) =>
        old?.filter((eq) => eq.id !== id)
      );
      
      return { previousEquipment };
    },
    onError: (error, _, context) => {
      if (context?.previousEquipment) {
        queryClient.setQueryData(["equipment"], context.previousEquipment);
      }
      toast.error("Erreur lors de la suppression");
      console.error("[Equipment] Delete error:", error);
    },
    onSuccess: () => {
      toast.success("Matériel supprimé");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });

  return {
    equipment,
    isLoading,
    error,
    addEquipment: addEquipment.mutate,
    addEquipmentAsync: addEquipment.mutateAsync,
    updateEquipment: updateEquipment.mutate,
    deleteEquipment: deleteEquipment.mutate,
    isAdding: addEquipment.isPending,
    isUpdating: updateEquipment.isPending,
    isDeleting: deleteEquipment.isPending,
  };
};
