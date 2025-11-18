import { useState } from "react";
import { useMaintenanceLogs } from "@/hooks/useMaintenanceLogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceTabProps {
  equipmentId: string;
}

export const MaintenanceTab = ({ equipmentId }: MaintenanceTabProps) => {
  const { logs, isLoading, addLog } = useMaintenanceLogs(equipmentId);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [actions, setActions] = useState("");
  const [status, setStatus] = useState<"ouvert" | "en_cours" | "resolu" | "ferme">("ouvert");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addLog.mutateAsync({
      equipment_id: equipmentId,
      description_probleme: description,
      actions_effectuees: actions || undefined,
      status,
    });
    setDescription("");
    setActions("");
    setStatus("ouvert");
    setShowForm(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ouvert: { variant: "destructive", label: "Ouvert" },
      en_cours: { variant: "secondary", label: "En cours" },
      resolu: { variant: "default", label: "Résolu" },
      ferme: { variant: "outline", label: "Fermé" },
    };
    const config = variants[status] || variants.ouvert;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historique de maintenance</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rapport
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveau rapport de maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description du problème *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le problème rencontré..."
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actions">Actions effectuées</Label>
                <Textarea
                  id="actions"
                  value={actions}
                  onChange={(e) => setActions(e.target.value)}
                  placeholder="Décrivez les actions de maintenance..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ouvert">Ouvert</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="resolu">Résolu</SelectItem>
                    <SelectItem value="ferme">Fermé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Enregistrer</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun rapport de maintenance</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {log.profiles?.full_name || log.profiles?.email || "Utilisateur inconnu"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.report_date), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                  {getStatusBadge(log.status)}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Problème :</p>
                    <p className="text-sm">{log.description_probleme}</p>
                  </div>
                  
                  {log.actions_effectuees && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Actions :</p>
                      <p className="text-sm">{log.actions_effectuees}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
