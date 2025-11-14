import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types/equipment";
import { toast } from "@/components/ui/use-toast";
import { qrGenerator } from "@/lib/qr-generator";

export const useEquipment = () => {
  const queryClient = useQueryClient();

  // Fetch all equipment
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

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
      })) as Equipment[];
    },
  });

 // Add equipment
const addEquipment = useMutation({
  mutationFn: async (data: Partial<Equipment>) => {
    // Petite fonction utilitaire pour nettoyer les champs texte
    const normalizeText = (v?: string) =>
      v && v.trim() !== "" ? v.trim() : null;

    // Les dates doivent être soit une string de date valide, soit null
    const normalizeDate = (v?: string) =>
      v && v.trim() !== "" ? v.trim() : null;

    // Generate QR code first
    const tempId = crypto.randomUUID();
    const qrCode = await qrGenerator.generate(tempId);

    const { data: newEquipment, error } = await supabase
      .from("equipment")
      .insert({
        id: tempId,
        poste: data.poste,                          // obligatoire
        category: data.category,                    // "PC", "Écran", etc.
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
      })
      .select()
      .single();

    if (error) throw error;
    return newEquipment;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["equipment"] });
    toast({
      title: "Matériel ajouté",
      description: "Le matériel a été ajouté avec succès.",
    });
  },
  onError: (error) => {
    toast({
      title: "Erreur",
      description: "Impossible d'ajouter le matériel.",
      variant: "destructive",
    });
    console.error("Add equipment error:", error);
  },
});

  // Update equipment
  const updateEquipment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Equipment> }) => {
      const { error } = await supabase
        .from("equipment")
        .update({
          poste: data.poste,
          category: data.category,
          marque: data.marque,
          modele: data.modele,
          numero_serie: data.numeroSerie,
          etat: data.etat,
          date_achat: data.dateAchat,
          fin_garantie: data.finGarantie,
          notes: data.notes,
          processeur: data.processeur,
          ram: data.ram,
          capacite_dd: data.capaciteDd,
          alimentation: data.alimentation,
          os: data.os,
          adresse_mac: data.adresseMac,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast({
        title: "Matériel mis à jour",
        description: "Le matériel a été mis à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le matériel.",
        variant: "destructive",
      });
    },
  });

  // Delete equipment
  const deleteEquipment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast({
        title: "Matériel supprimé",
        description: "Le matériel a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le matériel.",
        variant: "destructive",
      });
    },
  });

  return {
    equipment,
    isLoading,
    addEquipment: addEquipment.mutate,
    updateEquipment: updateEquipment.mutate,
    deleteEquipment: deleteEquipment.mutate,
  };
};
