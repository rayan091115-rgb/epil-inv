import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Equipment } from "@/types/equipment";
import { csvUtils } from "@/lib/csv-utils";
import { qrGenerator } from "@/lib/qr-generator";
import { useAuth } from "@/hooks/useAuth";
import { useEquipment } from "@/hooks/useEquipment";
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
  LogOut,
  ScanLine
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { equipment, isLoading, addEquipment, updateEquipment, deleteEquipment } = useEquipment();
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleAddEquipment = (data: Partial<Equipment>) => {
    addEquipment(data);
    setShowForm(false);
  };

  const handleUpdateEquipment = (data: Partial<Equipment>) => {
    if (!editingEquipment) return;
    updateEquipment({ id: editingEquipment.id, data });
    setEditingEquipment(null);
    setShowForm(false);
  };

  const handleDeleteEquipment = (id: string) => {
    deleteEquipment(id);
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
      
      for (const item of parsed) {
        addEquipment(item);
      }
      
      toast({
        title: "Import réussi",
        description: `${parsed.length} équipement(s) importé(s).`,
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">EPIL Inventaire</h1>
            <p className="text-muted-foreground">Gestion du matériel informatique</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
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
            <QRScanner equipment={equipment} />
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
