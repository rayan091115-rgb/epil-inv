import { useState, useEffect } from "react";
import { Equipment } from "@/types/equipment";
import { storage } from "@/lib/storage";
import { csvUtils } from "@/lib/csv-utils";
import { qrGenerator } from "@/lib/qr-generator";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { EquipmentForm } from "@/components/EquipmentForm";
import { EquipmentList } from "@/components/EquipmentList";
import { QRScanner } from "@/components/QRScanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Download, 
  Upload,
  QrCode,
  ScanLine
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const data = storage.getAll();
    setEquipment(data);
  }, []);

  const handleAddEquipment = async (data: Partial<Equipment>) => {
    const newEquipment: Equipment = {
      ...data,
      id: crypto.randomUUID(),
      poste: data.poste!,
      category: data.category!,
      etat: data.etat || "OK",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Equipment;

    // Générer le QR code
    try {
      const qrCode = await qrGenerator.generate(newEquipment.id);
      newEquipment.qrCode = qrCode;
    } catch (error) {
      console.error("Error generating QR code:", error);
    }

    storage.add(newEquipment);
    setEquipment([...equipment, newEquipment]);
    setShowForm(false);
    toast({
      title: "Matériel ajouté",
      description: `${newEquipment.poste} a été ajouté à l'inventaire.`,
    });
  };

  const handleUpdateEquipment = (data: Partial<Equipment>) => {
    if (!editingEquipment) return;

    storage.update(editingEquipment.id, data);
    setEquipment(
      equipment.map((e) => (e.id === editingEquipment.id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e))
    );
    setEditingEquipment(null);
    setShowForm(false);
    toast({
      title: "Matériel mis à jour",
      description: `${data.poste || editingEquipment.poste} a été mis à jour.`,
    });
  };

  const handleDeleteEquipment = (id: string) => {
    const item = equipment.find((e) => e.id === id);
    storage.delete(id);
    setEquipment(equipment.filter((e) => e.id !== id));
    toast({
      title: "Matériel supprimé",
      description: `${item?.poste} a été supprimé de l'inventaire.`,
    });
  };

  const handleExportCSV = () => {
    csvUtils.downloadCSV(equipment);
    toast({
      title: "Export réussi",
      description: "L'inventaire a été exporté en CSV.",
    });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const parsed = csvUtils.parseCSV(content);
      
      const newEquipment: Equipment[] = [];
      for (const item of parsed) {
        const newItem: Equipment = {
          ...item,
          id: crypto.randomUUID(),
          poste: item.poste!,
          category: item.category!,
          etat: item.etat || "OK",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Equipment;

        try {
          const qrCode = await qrGenerator.generate(newItem.id);
          newItem.qrCode = qrCode;
        } catch (error) {
          console.error("Error generating QR code:", error);
        }

        newEquipment.push(newItem);
      }

      const updated = [...equipment, ...newEquipment];
      storage.save(updated);
      setEquipment(updated);
      
      toast({
        title: "Import réussi",
        description: `${newEquipment.length} équipement(s) importé(s).`,
      });
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const stats = {
    total: equipment.length,
    ok: equipment.filter((e) => e.etat === "OK").length,
    panne: equipment.filter((e) => e.etat === "Panne").length,
    hs: equipment.filter((e) => e.etat === "HS").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">EPIL Inventaire</h1>
          <p className="text-muted-foreground">Gestion du matériel informatique</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total" value={stats.total} icon={Package} />
          <StatCard title="Opérationnel" value={stats.ok} icon={Package} description="En bon état" />
          <StatCard title="En panne" value={stats.panne} icon={AlertTriangle} description="À réparer" />
          <StatCard title="Hors service" value={stats.hs} icon={XCircle} description="À remplacer" />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button onClick={() => { setEditingEquipment(null); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un matériel
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Importer CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCSV}
              />
            </label>
          </Button>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="inventory">
              <Package className="mr-2 h-4 w-4" />
              Inventaire
            </TabsTrigger>
            <TabsTrigger value="scanner">
              <ScanLine className="mr-2 h-4 w-4" />
              Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <EquipmentList
              equipment={equipment}
              onEdit={(e) => { setEditingEquipment(e); setShowForm(true); }}
              onDelete={handleDeleteEquipment}
            />
          </TabsContent>

          <TabsContent value="scanner">
            <QRScanner />
          </TabsContent>
        </Tabs>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? "Modifier le matériel" : "Ajouter un matériel"}
              </DialogTitle>
            </DialogHeader>
            <EquipmentForm
              equipment={editingEquipment || undefined}
              onSubmit={editingEquipment ? handleUpdateEquipment : handleAddEquipment}
              onCancel={() => { setShowForm(false); setEditingEquipment(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
