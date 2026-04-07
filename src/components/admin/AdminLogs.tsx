import { useEffect, useMemo, useState } from "react";

import { DenseToolbar, SectionPanel, SurfaceBadge } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSystemLogs } from "@/hooks/useSystemLogs";
import { toast } from "sonner";

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const { getSystemLogs } = useSystemLogs();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getSystemLogs(500);
      setLogs(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [actionFilter, logs, searchTerm]);

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  const exportLogs = () => {
    const csv = [
      ["Date", "Utilisateur", "Action", "Type", "Details", "IP", "User Agent"],
      ...filteredLogs.map((log) => [
        new Date(log.created_at).toLocaleString("fr-FR"),
        log.profiles?.email || "Systeme",
        log.action,
        log.resource_type || "-",
        JSON.stringify(log.details || {}),
        log.ip_address || "-",
        log.user_agent || "-",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Logs exportes avec succes");
  };

  return (
    <SectionPanel
      title="Logs systeme"
      description="Recherche rapide, filtrage par action et export a plat."
      action={
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Icons.download className="h-[18px] w-[18px]" />
            Exporter
          </Button>
          <Button onClick={loadLogs} variant="outline" size="sm">
            <Icons.refresh className={`h-[18px] w-[18px] ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <DenseToolbar className="bg-secondary/30 shadow-none">
          <div className="relative w-full max-w-xl">
            <Icons.search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les logs..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Type d action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SurfaceBadge>{filteredLogs.length} ligne(s)</SurfaceBadge>
          </div>
        </DenseToolbar>

        <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card">
          {loading ? (
            <div className="p-6">
              <div className="glass-skeleton h-72 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      Aucun log trouve.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.created_at).toLocaleString("fr-FR")}</TableCell>
                      <TableCell>{log.profiles?.email || "Systeme"}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>{log.resource_type || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{JSON.stringify(log.details || {})}</TableCell>
                      <TableCell>{log.ip_address || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </SectionPanel>
  );
}
