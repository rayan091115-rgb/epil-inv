import { memo, useCallback, useMemo, useState } from "react";

import { DenseToolbar, SectionPanel, SurfaceBadge } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { qrGenerator } from "@/lib/qr-generator";
import { Equipment } from "@/types/equipment";

interface EquipmentListProps {
  equipment: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
}

const ITEMS_PER_PAGE = 25;

const statusClassNames: Record<string, string> = {
  OK: "status-ok",
  Panne: "status-warning",
  HS: "status-danger",
};

export const EquipmentList = memo(({ equipment = [], onEdit, onDelete, onEquipmentClick }: EquipmentListProps) => {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQR, setSelectedQR] = useState<{ url: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const safeEquipment = Array.isArray(equipment) ? equipment : [];

  const categories = useMemo(() => {
    const values = new Set(safeEquipment.map((item) => item.category));
    return Array.from(values).sort();
  }, [safeEquipment]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return safeEquipment.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.poste?.toLowerCase().includes(normalizedSearch) ||
        item.marque?.toLowerCase().includes(normalizedSearch) ||
        item.modele?.toLowerCase().includes(normalizedSearch) ||
        item.numeroSerie?.toLowerCase().includes(normalizedSearch);

      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      const matchesStatus = filterStatus === "all" || item.etat === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [filterCategory, filterStatus, safeEquipment, search]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const handleDownloadAllQR = useCallback(async () => {
    try {
      toast({
        title: "Generation en cours",
        description: "Preparation de l archive ZIP...",
      });

      await qrGenerator.downloadMultipleQR(filtered.map((item) => ({ id: item.id, poste: item.poste })));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de generer l archive",
        variant: "destructive",
      });
    }
  }, [filtered]);

  const handleViewQR = useCallback(async (item: Equipment) => {
    try {
      const qrCode = await qrGenerator.generate(item.id);
      setSelectedQR({ url: qrCode, name: item.poste });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de generer le QR code",
        variant: "destructive",
      });
    }
  }, []);

  const handleDownloadQR = useCallback(() => {
    if (!selectedQR) return;

    qrGenerator.downloadQR(selectedQR.url, `QR_${selectedQR.name}`);
    toast({
      title: "QR telecharge",
      description: `Le QR code pour ${selectedQR.name} a ete telecharge.`,
    });
  }, [selectedQR]);

  const getStatusBadge = useCallback((status: string) => {
    return (
      <Badge variant="outline" className={statusClassNames[status] || "border-border bg-background text-foreground"}>
        {status}
      </Badge>
    );
  }, []);

  return (
    <SectionPanel
      title="Inventaire du materiel"
      description="Filtrez, consultez et agissez sur le parc avec une table plus dense et mieux alignee."
      action={
        filtered.length > 0 ? (
          <Button variant="outline" size="sm" onClick={handleDownloadAllQR}>
            <Icons.download className="h-[18px] w-[18px]" />
            QR ZIP
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <DenseToolbar className="bg-secondary/30 shadow-none">
          <div className="relative w-full max-w-xl">
            <Icons.search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un poste, une marque ou un numero de serie..."
              aria-label="Rechercher du materiel"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <Select
              value={filterCategory}
              onValueChange={(value) => {
                setFilterCategory(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[200px]" aria-label="Filtrer par categorie">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[170px]" aria-label="Filtrer par etat">
                <SelectValue placeholder="Etat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les etats</SelectItem>
                <SelectItem value="OK">OK</SelectItem>
                <SelectItem value="Panne">Panne</SelectItem>
                <SelectItem value="HS">HS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DenseToolbar>

        <div className="flex flex-wrap items-center gap-2">
          <SurfaceBadge>{filtered.length} resultat(s)</SurfaceBadge>
          <SurfaceBadge>{categories.length} categorie(s)</SurfaceBadge>
          <SurfaceBadge>{safeEquipment.length} total inventorie</SurfaceBadge>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card">
          <Table aria-label="Liste du materiel">
            <TableHeader>
              <TableRow>
                <TableHead>Poste</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Marque</TableHead>
                <TableHead>Etat</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Aucun materiel trouve avec ces filtres.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => {
                      onEquipmentClick?.(item);
                    }}
                  >
                    <TableCell className="min-w-[220px]">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{item.poste}</p>
                        <p className="text-xs text-muted-foreground">{item.numeroSerie || "Numero de serie non renseigne"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.marque || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.etat)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Voir le QR code de ${item.poste}`}
                          onClick={() => handleViewQR(item)}
                        >
                          <Icons.qr className="h-[18px] w-[18px]" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Modifier ${item.poste}`}
                          onClick={() => onEdit(item)}
                        >
                          <Icons.edit className="h-[18px] w-[18px]" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Supprimer ${item.poste}`}
                          onClick={() => setDeleteConfirm({ id: item.id, name: item.poste })}
                        >
                          <Icons.trash className="h-[18px] w-[18px]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage}</span> sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                <Icons.previous className="h-[18px] w-[18px]" />
                Precedent
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
                <Icons.next className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>QR code - {selectedQR?.name}</DialogTitle>
          </DialogHeader>
          {selectedQR ? (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-border/70 bg-secondary/30 p-6">
                <img src={selectedQR.url} alt="QR code" className="mx-auto w-full max-w-sm" />
              </div>
              <Button onClick={handleDownloadQR} className="w-full">
                <Icons.download className="h-[18px] w-[18px]" />
                Telecharger le QR code
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer l equipement "{deleteConfirm?.name}" ? Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteConfirm) return;
                onDelete(deleteConfirm.id);
                toast({
                  title: "Equipement supprime",
                  description: `${deleteConfirm.name} a ete retire de l inventaire.`,
                });
                setDeleteConfirm(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionPanel>
  );
});

EquipmentList.displayName = "EquipmentList";
