import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { IconBadge } from "@/components/app/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceTab } from "@/components/equipment/MaintenanceTab";
import { PhotosTab } from "@/components/equipment/PhotosTab";
import { useScanHistory } from "@/hooks/useScanHistory";
import { Equipment } from "@/types/equipment";

interface EquipmentDetailModalProps {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const infoRowClassName = "rounded-2xl border border-border/70 bg-secondary/30 p-4";

const getStatusBadge = (status: string) => {
  const className =
    status === "OK"
      ? "status-ok"
      : status === "Panne"
        ? "status-warning"
        : "status-danger";

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
};

export const EquipmentDetailModal = ({ equipment, open, onOpenChange }: EquipmentDetailModalProps) => {
  const { scanHistory, isLoading } = useScanHistory(equipment?.id);

  if (!equipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex flex-col gap-4 rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,247,249,0.95))] p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <IconBadge icon="cube" className="hidden sm:inline-flex" />
              <div className="space-y-2">
                <DialogTitle className="text-2xl">{equipment.poste}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(equipment.etat)}
                  <Badge variant="outline">{equipment.category}</Badge>
                  {equipment.marque ? <Badge variant="outline">{equipment.marque}</Badge> : null}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
              Cree le {format(new Date(equipment.createdAt), "dd/MM/yyyy", { locale: fr })}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 md:grid-cols-4">
            <TabsTrigger value="details">
              <span className="inline-flex items-center gap-2">
                <IconBadge icon="notes" className="h-8 w-8 rounded-xl shadow-none" iconClassName="h-4 w-4" />
                Details
              </span>
            </TabsTrigger>
            <TabsTrigger value="history">
              <span className="inline-flex items-center gap-2">
                <IconBadge icon="history" className="h-8 w-8 rounded-xl shadow-none" iconClassName="h-4 w-4" />
                Historique
              </span>
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <span className="inline-flex items-center gap-2">
                <IconBadge icon="settings" className="h-8 w-8 rounded-xl shadow-none" iconClassName="h-4 w-4" />
                Maintenance
              </span>
            </TabsTrigger>
            <TabsTrigger value="photos">
              <span className="inline-flex items-center gap-2">
                <IconBadge icon="image" className="h-8 w-8 rounded-xl shadow-none" iconClassName="h-4 w-4" />
                Photos
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations generales</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className={infoRowClassName}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Categorie</p>
                  <p className="mt-1 font-medium text-foreground">{equipment.category}</p>
                </div>
                <div className={infoRowClassName}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Etat</p>
                  <p className="mt-1 font-medium text-foreground">{equipment.etat}</p>
                </div>
                {equipment.marque ? (
                  <div className={infoRowClassName}>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Marque</p>
                    <p className="mt-1 font-medium text-foreground">{equipment.marque}</p>
                  </div>
                ) : null}
                {equipment.modele ? (
                  <div className={infoRowClassName}>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Modele</p>
                    <p className="mt-1 font-medium text-foreground">{equipment.modele}</p>
                  </div>
                ) : null}
                {equipment.numeroSerie ? (
                  <div className={infoRowClassName}>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Numero de serie</p>
                    <p className="mt-1 font-medium text-foreground">{equipment.numeroSerie}</p>
                  </div>
                ) : null}
                {equipment.dateAchat ? (
                  <div className={infoRowClassName}>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Date d achat</p>
                    <p className="mt-1 font-medium text-foreground">
                      {format(new Date(equipment.dateAchat), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                ) : null}
                {equipment.finGarantie ? (
                  <div className={infoRowClassName}>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Fin de garantie</p>
                    <p className="mt-1 font-medium text-foreground">
                      {format(new Date(equipment.finGarantie), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {equipment.category === "PC" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Specifications PC</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {equipment.processeur ? (
                    <div className={infoRowClassName}>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Processeur</p>
                      <p className="mt-1 font-medium text-foreground">{equipment.processeur}</p>
                    </div>
                  ) : null}
                  {equipment.ram ? (
                    <div className={infoRowClassName}>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">RAM</p>
                      <p className="mt-1 font-medium text-foreground">{equipment.ram}</p>
                    </div>
                  ) : null}
                  {equipment.capaciteDd ? (
                    <div className={infoRowClassName}>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Stockage</p>
                      <p className="mt-1 font-medium text-foreground">{equipment.capaciteDd}</p>
                    </div>
                  ) : null}
                  {equipment.os ? (
                    <div className={infoRowClassName}>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Systeme</p>
                      <p className="mt-1 font-medium text-foreground">{equipment.os}</p>
                    </div>
                  ) : null}
                  {equipment.adresseMac ? (
                    <div className={infoRowClassName}>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Adresse MAC</p>
                      <p className="mt-1 font-medium text-foreground">{equipment.adresseMac}</p>
                    </div>
                  ) : null}
                  <div className={infoRowClassName}>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Alimentation</p>
                    <p className="mt-1 font-medium text-foreground">{equipment.alimentation ? "Oui" : "Non"}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {equipment.notes ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 text-sm leading-6 text-foreground">
                    {equipment.notes}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historique des scans</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </div>
                ) : scanHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
                    Aucun scan enregistre pour ce materiel.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scanHistory.map((scan: any) => (
                      <div key={scan.id} className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-medium text-foreground">
                            {scan.profiles?.full_name || scan.profiles?.email || "Utilisateur inconnu"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(scan.scanned_at), "dd/MM/yyyy 'a' HH:mm", { locale: fr })}
                          </p>
                        </div>
                        {scan.scanner_notes ? <p className="mt-2 text-sm text-foreground">{scan.scanner_notes}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceTab equipmentId={equipment.id} />
          </TabsContent>

          <TabsContent value="photos">
            <PhotosTab equipmentId={equipment.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
