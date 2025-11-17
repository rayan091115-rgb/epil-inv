import { useState } from "react";
import { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Search, QrCode, Download, Eye } from "lucide-react";
import { qrGenerator } from "@/lib/qr-generator";
import { toast } from "@/components/ui/use-toast";

interface EquipmentListProps {
  equipment: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
}

export const EquipmentList = ({ equipment, onEdit, onDelete, onEquipmentClick }: EquipmentListProps) => {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [selectedQR, setSelectedQR] = useState<{ url: string; name: string } | null>(null);

  const filtered = equipment.filter((item) => {
    const matchesSearch =
      item.poste.toLowerCase().includes(search.toLowerCase()) ||
      item.marque?.toLowerCase().includes(search.toLowerCase()) ||
      item.modele?.toLowerCase().includes(search.toLowerCase()) ||
      item.numeroSerie?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !filterCategory || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const handleViewQR = async (item: Equipment) => {
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
  };

  const handleDownloadQR = () => {
    if (selectedQR) {
      qrGenerator.downloadQR(selectedQR.url, `QR_${selectedQR.name}`);
      toast({
        title: "QR Code téléchargé",
        description: `Le QR code pour ${selectedQR.name} a été téléchargé.`,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      OK: "default",
      Panne: "secondary",
      HS: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventaire du matériel</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par poste, marque, modèle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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
                <TableHead>Modèle</TableHead>
                <TableHead>N° Série</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun matériel trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onEquipmentClick?.(item)}>
                    <TableCell className="font-medium">{item.poste}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.marque || "-"}</TableCell>
                    <TableCell>{item.modele || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{item.numeroSerie || "-"}</TableCell>
                    <TableCell>{getStatusBadge(item.etat)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewQR(item)}
                          title="Voir le QR code"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(item)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(item.id)}
                          title="Supprimer"
                        >
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
      </CardContent>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedQR?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedQR && (
              <>
                <img 
                  src={selectedQR.url} 
                  alt={`QR Code for ${selectedQR.name}`}
                  className="w-64 h-64 border rounded-lg"
                />
                <Button onClick={handleDownloadQR} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le QR Code
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
