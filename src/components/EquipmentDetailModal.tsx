import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Equipment } from "@/types/equipment";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScanHistory } from "@/hooks/useScanHistory";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, User, FileText, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EquipmentDetailModalProps {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EquipmentDetailModal = ({
  equipment,
  open,
  onOpenChange,
}: EquipmentDetailModalProps) => {
  const { scanHistory, isLoading } = useScanHistory(equipment?.id);

  if (!equipment) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      OK: "default",
      Panne: "secondary",
      HS: "destructive",
    } as const;
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {equipment.poste}
            {getStatusBadge(equipment.etat)}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Catégorie</p>
                  <p className="font-medium">{equipment.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">État</p>
                  <p className="font-medium">{equipment.etat}</p>
                </div>
                {equipment.marque && (
                  <div>
                    <p className="text-sm text-muted-foreground">Marque</p>
                    <p className="font-medium">{equipment.marque}</p>
                  </div>
                )}
                {equipment.modele && (
                  <div>
                    <p className="text-sm text-muted-foreground">Modèle</p>
                    <p className="font-medium">{equipment.modele}</p>
                  </div>
                )}
                {equipment.numeroSerie && (
                  <div>
                    <p className="text-sm text-muted-foreground">N° Série</p>
                    <p className="font-medium">{equipment.numeroSerie}</p>
                  </div>
                )}
                {equipment.dateAchat && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'achat</p>
                    <p className="font-medium">
                      {format(new Date(equipment.dateAchat), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                )}
                {equipment.finGarantie && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fin de garantie</p>
                    <p className="font-medium">
                      {format(new Date(equipment.finGarantie), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {equipment.category === "PC" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spécifications PC</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {equipment.processeur && (
                    <div>
                      <p className="text-sm text-muted-foreground">Processeur</p>
                      <p className="font-medium">{equipment.processeur}</p>
                    </div>
                  )}
                  {equipment.ram && (
                    <div>
                      <p className="text-sm text-muted-foreground">RAM</p>
                      <p className="font-medium">{equipment.ram}</p>
                    </div>
                  )}
                  {equipment.capaciteDd && (
                    <div>
                      <p className="text-sm text-muted-foreground">Disque dur</p>
                      <p className="font-medium">{equipment.capaciteDd}</p>
                    </div>
                  )}
                  {equipment.os && (
                    <div>
                      <p className="text-sm text-muted-foreground">OS</p>
                      <p className="font-medium">{equipment.os}</p>
                    </div>
                  )}
                  {equipment.adresseMac && (
                    <div>
                      <p className="text-sm text-muted-foreground">Adresse MAC</p>
                      <p className="font-medium">{equipment.adresseMac}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Alimentation</p>
                    <p className="font-medium">{equipment.alimentation ? "Oui" : "Non"}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {equipment.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{equipment.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Historique des scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : scanHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun scan enregistré pour ce matériel
                  </p>
                ) : (
                  <div className="space-y-3">
                    {scanHistory.map((scan: any) => (
                      <div
                        key={scan.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <User className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {scan.profiles?.full_name || scan.profiles?.email || "Utilisateur inconnu"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(scan.scanned_at), "dd/MM/yyyy à HH:mm", {
                              locale: fr,
                            })}
                          </p>
                          {scan.scanner_notes && (
                            <p className="text-sm mt-1">{scan.scanner_notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Fonctionnalité de gestion des photos à venir
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
