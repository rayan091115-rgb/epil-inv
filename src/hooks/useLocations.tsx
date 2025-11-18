import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Location {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useLocations = () => {
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Location[];
    },
  });

  const addLocation = useMutation({
    mutationFn: async (location: { name: string; description?: string }) => {
      const { error } = await supabase.from("locations").insert(location);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({ title: "Emplacement ajouté avec succès" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { locations, isLoading, addLocation };
};
