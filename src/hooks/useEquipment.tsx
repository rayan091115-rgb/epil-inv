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
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) as Equipment[];
    },
  });

  // Add equipment
  const addEquipment = useMutation({
    mutationFn: async (data: Partial<Equipment>) => {
      // Generate QR code first
      const tempId = crypto.randomUUID();
      const qrCode = await qrGenerator.generate(tempId);

      const { data: newEquipment, error } = await supabase
        .from("equipment")
        .insert({
          id: tempId,
          poste: data.poste,
          category: data.category,
          marque: data.marque,
          modele: data.modele,
          numero_serie: data.numeroSerie,
          etat: data.etat || "OK",
          date_achat: data.dateAchat,
          fin_garantie: data.finGarantie,
          notes: data.notes,
          qr_code: qrCode,
        })
        .select()
        .single();

      if (error) throw error;
      return newEquipment;
    },
    onSuccess: async (newEquipment) => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast({
        title: "Matériel ajouté",
        description: "Le matériel a été ajouté avec succès.",
      });

      // Notify n8n webhook
      try {
        await supabase.functions.invoke('notify-equipment-added', {
          body: { equipmentId: newEquipment.id }
        });
        console.log('n8n notification sent successfully');
      } catch (error) {
        console.error('Failed to notify n8n:', error);
        // Ne pas bloquer l'utilisateur si la notification échoue
      }
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
