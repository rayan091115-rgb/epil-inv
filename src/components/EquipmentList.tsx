import { useState, useMemo, memo, useCallback } from "react";
import { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Search, QrCode, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { qrGenerator } from "@/lib/qr-generator";
import { toast } from "@/components/ui/use-toast";

interface EquipmentListProps {
  equipment: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
}

const ITEMS_PER_PAGE = 25;

export const EquipmentList = memo(({ equipment = [], onEdit, onDelete, onEquipmentClick }: EquipmentListProps) => {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQR, setSelectedQR] = useState<{ url: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const safeEquipment = Array.isArray(equipment) ? equipment : [];

  const categories = useMemo(() => {
    const cats = new Set(safeEquipment.map((e) => e.category));
    return Array.from(cats).sort();
  }, [safeEquipment]);

  const filtered = useMemo(() => {
    // Pre-compute normalized search term to avoid repeated toLowerCase() calls
    const normalizedSearch = search.toLowerCase().trim();
    
    return safeEquipment.filter((item) => {
      const matchesSearch = !normalizedSearch || 
        (item.poste?.toLowerCase().includes(normalizedSearch) ||
         item.marque?.toLowerCase().includes(normalizedSearch) ||
         item.modele?.toLowerCase().includes(normalizedSearch) ||
         item.numeroSerie?.toLowerCase().includes(normalizedSearch));

      const matchesCategory = filterCategory === "all" || !filterCategory || item.category === filterCategory;
      const matchesStatus = filterStatus === "all" || !filterStatus || item.etat === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [safeEquipment, search, filterCategory, filterStatus]);

  const handleDownloadAllQR = useCallback(async () => {
    try {
      toast({
        title: "Génération en cours",
        description: "Préparation de l'archive ZIP...",
      });
      const itemsToExport = filtered.map(item => ({ id: item.id, poste: item.poste }));
      await qrGenerator.downloadMultipleQR(itemsToExport);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer l'archive",
        variant: "destructive",
      });
    }
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleViewQR = useCallback(async (item: Equipment) => {
    try {
      const qrCode = await qrGenerator.generate(item.id);
      setSelectedQR({ url: qrCode, name: item.poste });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le QR code",
        variant: "destructive",
      });
    }
  }, []);

  const handleDownloadQR = useCallback(() => {
    if (selectedQR) {
      qrGenerator.downloadQR(selectedQR.url, `QR_${selectedQR.name}`);
      toast({
        title: "QR Code téléchargé",
        description: `Le QR code pour ${selectedQR.name} a été téléchargé.`,
      });
    }
  }, [selectedQR]);

  const handleDeleteClick = useCallback((item: Equipment) => {
    setDeleteConfirm({ id: item.id, name: item.poste });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
      toast({
        title: "Équipement supprimé",
        description: `${deleteConfirm.name} a été supprimé.`,
      });
    }
  }, [deleteConfirm, onDelete]);

  const getStatusBadge = useCallback((status: string) => {
    const classMap: Record<string, string> = {
      OK:    "ln-pill-ok",
      Panne: "ln-pill-panne",
      HS:    "ln-pill-hs",
    };
    return (
      <span className={classMap[status] || "ln-pill-ok"}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor", display: "inline-block", flexShrink: 0 }} />
        {status}
      </span>
    );
  }, []);

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e6e6e6",
    borderRadius: "8px",
    boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 4px 0px",
  };

  return (
    <div style={cardStyle}>
      {/* Toolbar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 510, color: "#1a1a1e", letterSpacing: "-0.182px" }}>
            Inventaire · <span style={{ color: "#8a8f98", fontWeight: 400 }}>{filtered.length} résultats</span>
          </span>
          {filtered.length > 0 && (
            <button
              onClick={handleDownloadAllQR}
              className="ln-btn-ghost"
              style={{ fontSize: "12px", padding: "5px 10px" }}
            >
              <Download style={{ width: "12px", height: "12px" }} />
              Télécharger ZIP
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "13px", height: "13px", color: "#8a8f98" }} />
            <input
              placeholder="Rechercher un poste, une marque…"
              aria-label="Rechercher du matériel"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{
                width: "100%",
                background: "#f7f8f8",
                border: "1px solid #e6e6e6",
                borderRadius: "6px",
                padding: "7px 12px 7px 32px",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                fontFeatureSettings: '"cv01" 1, "ss03" 1',
                color: "#1a1a1e",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#7170ff"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(113,112,255,0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e6e6e6"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1); }}>
            <SelectTrigger
              className="w-[160px]"
              aria-label="Filtrer par catégorie"
              style={{ fontSize: "13px", height: "34px", borderColor: "#e6e6e6", background: "#f7f8f8" }}
            >
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
            <SelectTrigger
              className="w-[120px]"
              aria-label="Filtrer par état"
              style={{ fontSize: "13px", height: "34px", borderColor: "#e6e6e6", background: "#f7f8f8" }}
            >
              <SelectValue placeholder="État" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les états</SelectItem>
              <SelectItem value="OK">OK</SelectItem>
              <SelectItem value="Panne">Panne</SelectItem>
              <SelectItem value="HS">HS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Table aria-label="Liste de l'équipement">
            <TableHeader>
              <TableRow style={{ borderBottom: "1px solid #f0f0f0" }}>
                <TableHead style={{ fontSize: "11px", fontWeight: 510, color: "#8a8f98", letterSpacing: "0.04em", textTransform: "uppercase", padding: "10px 16px" }}>Poste</TableHead>
                <TableHead style={{ fontSize: "11px", fontWeight: 510, color: "#8a8f98", letterSpacing: "0.04em", textTransform: "uppercase", padding: "10px 16px" }}>Catégorie</TableHead>
                <TableHead style={{ fontSize: "11px", fontWeight: 510, color: "#8a8f98", letterSpacing: "0.04em", textTransform: "uppercase", padding: "10px 16px" }}>Marque</TableHead>
                <TableHead style={{ fontSize: "11px", fontWeight: 510, color: "#8a8f98", letterSpacing: "0.04em", textTransform: "uppercase", padding: "10px 16px" }}>État</TableHead>
                <TableHead style={{ fontSize: "11px", fontWeight: 510, color: "#8a8f98", letterSpacing: "0.04em", textTransform: "uppercase", padding: "10px 16px", textAlign: "right" }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    style={{ textAlign: "center", padding: "48px 16px", color: "#8a8f98", fontSize: "13px", letterSpacing: "-0.13px" }}
                  >
                    Aucun matériel trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="ln-table-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => onEquipmentClick?.(item)}
                  >
                    <TableCell style={{ fontSize: "13px", fontWeight: 510, color: "#1a1a1e", padding: "11px 16px", letterSpacing: "-0.13px" }}>{item.poste}</TableCell>
                    <TableCell style={{ fontSize: "13px", color: "#62666d", padding: "11px 16px", letterSpacing: "-0.13px" }}>{item.category}</TableCell>
                    <TableCell style={{ fontSize: "13px", color: "#62666d", padding: "11px 16px", letterSpacing: "-0.13px" }}>{item.marque || "—"}</TableCell>
                    <TableCell style={{ padding: "11px 16px" }}>{getStatusBadge(item.etat)}</TableCell>
                    <TableCell style={{ padding: "11px 16px", textAlign: "right" }}>
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewQR(item)}
                          style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer", color: "#8a8f98", transition: "background 0.1s, color 0.1s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f5"; e.currentTarget.style.color = "#1a1a1e"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8a8f98"; }}
                        >
                          <QrCode style={{ width: "13px", height: "13px" }} />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer", color: "#8a8f98", transition: "background 0.1s, color 0.1s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f5"; e.currentTarget.style.color = "#1a1a1e"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8a8f98"; }}
                        >
                          <Edit style={{ width: "13px", height: "13px" }} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer", color: "#8a8f98", transition: "background 0.1s, color 0.1s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(229,72,77,0.08)"; e.currentTarget.style.color = "#e5484d"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8a8f98"; }}
                        >
                          <Trash2 style={{ width: "13px", height: "13px" }} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <span style={{ fontSize: "12px", color: "#8a8f98", letterSpacing: "-0.13px" }}>
              Page {currentPage} sur {totalPages}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="ln-btn-ghost"
                style={{ padding: "4px 8px", fontSize: "12px", opacity: currentPage === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft style={{ width: "13px", height: "13px" }} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ln-btn-ghost"
                style={{ padding: "4px 8px", fontSize: "12px", opacity: currentPage === totalPages ? 0.4 : 1 }}
              >
                <ChevronRight style={{ width: "13px", height: "13px" }} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent style={{ background: "#ffffff", border: "1px solid #e6e6e6", borderRadius: "12px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "15px", fontWeight: 590, letterSpacing: "-0.24px", color: "#1a1a1e" }}>QR Code · {selectedQR?.name}</DialogTitle>
          </DialogHeader>
          {selectedQR && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <img src={selectedQR.url} alt="QR code" style={{ width: "100%", maxWidth: "280px", margin: "0 auto", borderRadius: "8px" }} />
              <button onClick={handleDownloadQR} className="ln-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px" }}>
                <Download style={{ width: "13px", height: "13px" }} />
                Télécharger
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'équipement "{deleteConfirm?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

EquipmentList.displayName = "EquipmentList";
