import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Icons } from "@/components/app/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMaintenanceLogs } from "@/hooks/useMaintenanceLogs";

interface MaintenanceTabProps {
  equipmentId: string;
}

export const MaintenanceTab = ({ equipmentId }: MaintenanceTabProps) => {
  const { logs, isLoading, addLog } = useMaintenanceLogs(equipmentId);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [actions, setActions] = useState("");
  const [status, setStatus] = useState<"ouvert" | "en_cours" | "resolu" | "ferme">("ouvert");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const getStatusBadge = (currentStatus: string) => {
    const className =
      currentStatus === "ouvert"
        ? "status-danger"
        : currentStatus === "en_cours"
          ? "status-warning"
          : "status-ok";

    return (
      <Badge variant="outline" className={className}>
        {currentStatus}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">Historique de maintenance</h3>
        <Button size="sm" onClick={() => setShowForm((value) => !value)}>
          <Icons.plus className="h-[18px] w-[18px]" />
          Nouveau rapport
        </Button>
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveau rapport de maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description du probleme *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Decrivez le probleme rencontre..."
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actions">Actions effectuees</Label>
                <Textarea
                  id="actions"
                  value={actions}
                  onChange={(event) => setActions(event.target.value)}
                  placeholder="Decrivez les actions de maintenance..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ouvert">Ouvert</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="resolu">Resolu</SelectItem>
                    <SelectItem value="ferme">Ferme</SelectItem>
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
      ) : null}

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Icons.settings className="mx-auto mb-3 h-10 w-10 opacity-60" />
            Aucun rapport de maintenance.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {log.profiles?.full_name || log.profiles?.email || "Utilisateur inconnu"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.report_date), "dd MMMM yyyy 'a' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  {getStatusBadge(log.status)}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Probleme</p>
                    <p className="text-sm text-foreground">{log.description_probleme}</p>
                  </div>
                  {log.actions_effectuees ? (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Actions</p>
                      <p className="text-sm text-foreground">{log.actions_effectuees}</p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
