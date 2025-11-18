import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Upload, ImageIcon, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PhotosTabProps {
  equipmentId: string;
}

export const PhotosTab = ({ equipmentId }: PhotosTabProps) => {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["equipment_photos", equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("equipment_photos")
        .list(`${equipmentId}/`);

      if (error) throw error;

      return (data || []).map((file) => ({
        name: file.name,
        url: supabase.storage
          .from("equipment_photos")
          .getPublicUrl(`${equipmentId}/${file.name}`).data.publicUrl,
      }));
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoName: string) => {
      const { error } = await supabase.storage
        .from("equipment_photos")
        .remove([`${equipmentId}/${photoName}`]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_photos", equipmentId] });
      toast({ title: "Photo supprimée" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erreur",
        description: "Le fichier doit être une image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5 Mo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${equipmentId}/${fileName}`;

      const { error } = await supabase.storage
        .from("equipment_photos")
        .upload(filePath, file);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["equipment_photos", equipmentId] });
      toast({ title: "Photo ajoutée avec succès" });
    } catch (error: any) {
      toast({
        title: "Erreur d'upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Photos de l'équipement</h3>
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="photo-upload"
          />
          <Button size="sm" asChild disabled={uploading}>
            <label htmlFor="photo-upload" className="cursor-pointer">
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Ajouter une photo
            </label>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="aspect-square bg-muted animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Aucune photo</p>
            <p className="text-sm">Ajoutez des photos pour documenter cet équipement</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <Card key={photo.name} className="group relative overflow-hidden">
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deletePhoto.mutate(photo.name)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
