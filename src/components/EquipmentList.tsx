import { useState, useMemo, memo, useCallback } from "react";
import { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Search, QrCode, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { qrGenerator } from "@/lib/qr-generator";
import { toast } from "@/components/ui/use-toast";

interface EquipmentListProps {
  equipment: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
}

const ITEMS_PER_PAGE = 25;

export const EquipmentList = memo(({ equipment, onEdit, onDelete, onEquipmentClick }: EquipmentListProps) => {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQR, setSelectedQR] = useState<{ url: string; name: string } | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(equipment.map((e) => e.category));
    return Array.from(cats).sort();
  }, [equipment]);

  const filtered = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch =
        item.poste.toLowerCase().includes(search.toLowerCase()) ||
        item.marque?.toLowerCase().includes(search.toLowerCase()) ||
        item.modele?.toLowerCase().includes(search.toLowerCase()) ||
        item.numeroSerie?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = !filterCategory || item.category === filterCategory;
      const matchesStatus = !filterStatus || item.etat === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [equipment, search, filterCategory, filterStatus]);

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

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      OK: "default",
      Panne: "secondary",
      HS: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventaire du matériel ({filtered.length})</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="État" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              <SelectItem value="OK">OK</SelectItem>
              <SelectItem value="Panne">Panne</SelectItem>
              <SelectItem value="HS">HS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Poste</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Marque</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun matériel trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow 
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onEquipmentClick?.(item)}
                  >
                    <TableCell className="font-medium">{item.poste}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.marque || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.etat)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => handleViewQR(item)}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code - {selectedQR?.name}</DialogTitle>
          </DialogHeader>
          {selectedQR && (
            <div className="space-y-4">
              <img src={selectedQR.url} alt={`QR code`} className="w-full max-w-md mx-auto" />
              <Button onClick={handleDownloadQR} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
});

EquipmentList.displayName = "EquipmentList";
