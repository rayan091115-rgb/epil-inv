import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSystemLogs } from "@/hooks/useSystemLogs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Shield, Activity } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminPanel = () => {
  const { getSystemLogs } = useSystemLogs();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getSystemLogs(200);
    setLogs(data);
    setLoading(false);
  };

  const exportLogs = () => {
    const csvContent = [
      ["Date", "Utilisateur", "Action", "Détails"].join(","),
      ...logs.map((log) =>
        [
          format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr }),
          log.profiles?.email || "Système",
          log.action,
          JSON.stringify(log.details || {}),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs_systeme_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();

    toast({
      title: "Export réussi",
      description: "Les logs ont été exportés avec succès.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Panneau Administrateur</h2>
            <p className="text-sm text-muted-foreground">
              Gestion et surveillance du système
            </p>
          </div>
        </div>
        <Button onClick={exportLogs} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter les logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Actions enregistrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                logs.filter(
                  (log) =>
                    format(new Date(log.created_at), "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd")
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Activités du jour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map((log) => log.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Utilisateurs uniques
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs Système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Aucun log disponible
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.profiles?.email || "Système"}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.action}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
