import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Icons } from "@/components/app/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PhotosTabProps {
  equipmentId: string;
}

export const PhotosTab = ({ equipmentId }: PhotosTabProps) => {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["equipment_photos", equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("equipment_photos").list(`${equipmentId}/`);
      if (error) throw error;

      const files = data || [];
      if (files.length === 0) return [];

      const paths = files.map((file) => `${equipmentId}/${file.name}`);
      const { data: signed, error: signError } = await supabase.storage
        .from("equipment_photos")
        .createSignedUrls(paths, 3600);

      if (signError) throw signError;

      return files.map((file, index) => ({
        name: file.name,
        url: signed?.[index]?.signedUrl ?? "",
      }));
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoName: string) => {
      const { error } = await supabase.storage.from("equipment_photos").remove([`${equipmentId}/${photoName}`]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_photos", equipmentId] });
      toast({ title: "Photo supprimee" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const downloadPhoto = async (photoName: string, url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = photoName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast({ title: "Photo telechargee" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de telecharger la photo",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Erreur", description: "Le fichier doit etre une image", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erreur", description: "L image ne doit pas depasser 5 Mo", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${equipmentId}/${fileName}`;

      const { error } = await supabase.storage.from("equipment_photos").upload(filePath, file);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["equipment_photos", equipmentId] });
      toast({ title: "Photo ajoutee avec succes" });
    } catch (error: any) {
      toast({ title: "Erreur d upload", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">Photos de l equipement</h3>
        <div>
          <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" id="photo-upload" />
          <Button size="sm" asChild disabled={uploading}>
            <label htmlFor="photo-upload" className="cursor-pointer">
              {uploading ? (
                <Icons.refresh className="mr-2 h-[18px] w-[18px] animate-spin" />
              ) : (
                <Icons.upload className="mr-2 h-[18px] w-[18px]" />
              )}
              Ajouter une photo
            </label>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="glass-skeleton aspect-square" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Icons.image className="mx-auto mb-4 h-14 w-14 opacity-50" />
            <p className="mb-2 text-lg font-medium">Aucune photo</p>
            <p className="text-sm">Ajoutez des photos pour documenter cet equipement.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo) => (
            <Card key={photo.name} className="group relative overflow-hidden">
              <img src={photo.url} alt={photo.name} className="h-56 w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="icon" variant="secondary" onClick={() => downloadPhoto(photo.name, photo.url)}>
                  <Icons.download className="h-[18px] w-[18px]" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => deletePhoto.mutate(photo.name)}>
                  <Icons.trash className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
