import { useState, useEffect, useCallback, memo } from "react";
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
import { ImportCSVButton } from "@/components/ImportCSVButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, LogOut, ScanLine, FileText, LayoutDashboard, Shield } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Header Component
const Header = memo(({
  email,
  isAdmin,
  onNavigateAdmin,
  onSignOut
}: {
  email: string;
  isAdmin: boolean;
  onNavigateAdmin: () => void;
  onSignOut: () => void;
}) => (
  <header className="glass-card px-6 py-4 mb-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-xl font-semibold">Inventaire CIEL</h1>
        <p className="text-sm text-muted-foreground">
          {email}
          {isAdmin && <span className="ml-2 font-medium">• Admin</span>}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isAdmin && (
          <Button variant="default" size="sm" onClick={onNavigateAdmin}>
            <Shield className="h-4 w-4 mr-2" />
            Dashboard Admin
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  </header>
));
Header.displayName = "Header";

// Loading Spinner
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="glass-card p-8 flex flex-col items-center gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

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

  const handleAddEquipment = useCallback(async (data: Partial<Equipment>) => {
    try {
      await addEquipmentAsync(data);
      setShowForm(false);
      setEditingEquipment(null);
    } catch (error) {
      console.error("[Index] Add equipment error:", error);
    }
  }, [addEquipmentAsync]);

  const handleUpdateEquipment = useCallback((data: Partial<Equipment>) => {
    if (!editingEquipment) return;
    updateEquipment({ id: editingEquipment.id, data });
    setEditingEquipment(null);
    setShowForm(false);
  }, [editingEquipment, updateEquipment]);

  const handleDeleteEquipment = useCallback((id: string) => {
    deleteEquipment(id);
  }, [deleteEquipment]);

  const handleExportCSV = useCallback(() => {
    csvUtils.downloadCSV(equipment);
    toast.success("Inventaire exporté en CSV");
  }, [equipment]);

  const handleGenerateQRSheet = useCallback(async () => {
    if (equipment.length === 0) {
      toast.error("Veuillez ajouter des équipements avant de générer les étiquettes");
      return;
    }
    try {
      await generateA4QRSheet(equipment);
      toast.success("Feuille d'étiquettes QR générée");
    } catch (error) {
      console.error("[Index] QR sheet generation error:", error);
      toast.error("Impossible de générer le PDF");
    }
  }, [equipment]);

  const handleEquipmentClick = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleNavigateAdmin = useCallback(() => {
    navigate("/admin");
  }, [navigate]);

  if (authLoading || roleLoading) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Header
          email={user.email || ""}
          isAdmin={isAdmin}
          onNavigateAdmin={handleNavigateAdmin}
          onSignOut={handleSignOut}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-1 h-auto grid w-full grid-cols-2 lg:grid-cols-4 gap-1">
            <TabsTrigger
              value="dashboard"
              className="gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-lg py-2.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-lg py-2.5"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Inventaire</span>
            </TabsTrigger>
            <TabsTrigger
              value="scanner"
              className="gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-lg py-2.5"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scanner</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="admin"
                className="gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-lg py-2.5"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="animate-fade-in">
            <Dashboard equipment={equipment} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 animate-fade-in">
            <div className="glass-card p-4 flex flex-wrap gap-3">
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
              <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
              <ImportCSVButton />
              <Button variant="outline" onClick={handleGenerateQRSheet} className="gap-2">
                <FileText className="h-4 w-4" />
                Étiquettes QR
              </Button>
            </div>

            {isLoading ? (
              <div className="glass-card p-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
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

          <TabsContent value="scanner" className="space-y-4 animate-fade-in">
            <div className="flex justify-center">
              <Button onClick={() => setShowScanner(!showScanner)} size="lg" className="gap-2">
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

          {isAdmin && (
            <TabsContent value="admin" className="animate-fade-in">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? "Modifier le matériel" : "Ajouter du matériel"}
              </DialogTitle>
            </DialogHeader>
            <EquipmentForm
              key={editingEquipment ? editingEquipment.id : "new-equipment"}
              equipment={editingEquipment}
              onSubmit={editingEquipment ? handleUpdateEquipment : handleAddEquipment}
              onCancel={() => {
                setShowForm(false);
                setEditingEquipment(null);
              }}
            />
          </DialogContent>
        </Dialog>

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