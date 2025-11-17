import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Equipment } from "@/types/equipment";
import { csvUtils } from "@/lib/csv-utils";
import { generateA4QRSheet } from "@/lib/pdf-generator";
import { useAuth } from "@/hooks/useAuth";
import { useEquipment } from "@/hooks/useEquipment";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { EquipmentForm } from "@/components/EquipmentForm";
import { EquipmentList } from "@/components/EquipmentList";
import { QRScanner } from "@/components/QRScanner";
import { Dashboard } from "@/components/Dashboard";
import { AdminPanel } from "@/components/AdminPanel";
import { EquipmentDetailModal } from "@/components/EquipmentDetailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Download, 
  Upload,
  LogOut,
  ScanLine,
  FileText,
  LayoutDashboard,
  Shield
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { equipment, isLoading, addEquipmentAsync, updateEquipment, deleteEquipment } = useEquipment();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleAddEquipment = async (data: Partial<Equipment>) => {
    await addEquipmentAsync(data);
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

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const parsed = csvUtils.parseCSV(content);

      let success = 0;
      let failed = 0;

      for (const [index, item] of parsed.entries()) {
        try {
          if (!item.poste || item.poste.trim() === "") {
            console.warn(`Ligne ${index + 2} ignorée : poste vide`);
            failed++;
            continue;
          }

          await addEquipmentAsync(item);
          success++;
        } catch (err) {
          console.error(`Erreur ligne ${index + 2} :`, err);
          failed++;
        }
      }

      if (failed === 0) {
        toast({
          title: "Import réussi",
          description: `${success} équipement(s) importé(s).`,
        });
      } else {
        toast({
          title: "Import partiel",
          description: `${success} réussi(s), ${failed} en erreur.`,
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const handleGenerateQRSheet = async () => {
    if (equipment.length === 0) {
      toast({
        title: "Aucun équipement",
        description: "Veuillez ajouter des équipements avant de générer les étiquettes.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateA4QRSheet(equipment);
      toast({
        title: "PDF généré",
        description: "La feuille d'étiquettes QR a été générée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    }
  };

  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              EPIL Inventaire
            </h1>
            <p className="text-muted-foreground mt-1">
              {user.email} {isAdmin && <span className="text-primary font-semibold">• Admin</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <FileText className="h-4 w-4" />
              Inventaire
            </TabsTrigger>
            <TabsTrigger value="scanner" className="gap-2">
              <ScanLine className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard equipment={equipment} />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
              <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
              <label>
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Importer CSV
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
              <Button variant="outline" onClick={handleGenerateQRSheet} className="gap-2">
                <FileText className="h-4 w-4" />
                Générer étiquettes QR
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <EquipmentList
                equipment={equipment}
                onEdit={(eq) => {
                  setEditingEquipment(eq);
                  setShowForm(true);
                }}
                onDelete={handleDeleteEquipment}
                onEquipmentClick={handleEquipmentClick}
              />
            )}
          </TabsContent>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            <div className="flex justify-center">
              <Button
                onClick={() => setShowScanner(!showScanner)}
                size="lg"
                className="gap-2"
              >
                <ScanLine className="h-5 w-5" />
                {showScanner ? "Fermer le scanner" : "Ouvrir le scanner"}
              </Button>
            </div>
            {showScanner && (
              <div className="max-w-2xl mx-auto">
                <QRScanner equipment={equipment} />
              </div>
            )}
          </TabsContent>

          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>

        {/* Equipment Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? "Modifier le matériel" : "Ajouter du matériel"}
              </DialogTitle>
            </DialogHeader>
            <EquipmentForm
              equipment={editingEquipment}
              onSubmit={editingEquipment ? handleUpdateEquipment : handleAddEquipment}
              onCancel={() => {
                setShowForm(false);
                setEditingEquipment(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Equipment Detail Modal */}
        <EquipmentDetailModal
          equipment={selectedEquipment}
          open={!!selectedEquipment}
          onOpenChange={(open) => !open && setSelectedEquipment(null)}
        />
      </div>
    </div>
  );
};

export default Index;
