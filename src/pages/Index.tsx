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
import {
  Plus,
  Download,
  LogOut,
  ScanLine,
  FileText,
  LayoutDashboard,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Memoized Header Component
const Header = memo(
  ({
    email,
    isAdmin,
    onNavigateAdmin,
    onSignOut,
  }: {
    email: string;
    isAdmin: boolean;
    onNavigateAdmin: () => void;
    onSignOut: () => void;
  }) => (
    <header className="glass-card px-6 py-4 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">Inventaire CIEL</h1>
            <p className="text-sm text-muted-foreground">
              {email}{" "}
              {isAdmin && (
                <span className="text-primary font-semibold">• Admin</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button
              variant="default"
              size="sm"
              onClick={onNavigateAdmin}
              className="glass-button"
            >
              <Shield className="h-4 w-4 mr-2" />
              Dashboard Admin
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="border-border/50 hover:bg-secondary/50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  )
);

Header.displayName = "Header";

// Loading Spinner
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center animated-gradient">
    <div className="glass-card p-8 flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    equipment,
    isLoading,
    addEquipmentAsync,
    updateEquipment,
    deleteEquipment,
  } = useEquipment();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null
  );
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Stable callbacks
  const handleAddEquipment = useCallback(
    async (data: Partial<Equipment>) => {
      try {
        await addEquipmentAsync(data);
        setShowForm(false);
        setEditingEquipment(null);
      } catch (error) {
        console.error("[Index] Add equipment error:", error);
      }
    },
    [addEquipmentAsync]
  );

  const handleUpdateEquipment = useCallback(
    (data: Partial<Equipment>) => {
      if (!editingEquipment) return;
      updateEquipment({ id: editingEquipment.id, data });
      setEditingEquipment(null);
      setShowForm(false);
    },
    [editingEquipment, updateEquipment]
  );

  const handleDeleteEquipment = useCallback(
    (id: string) => {
      deleteEquipment(id);
    },
    [deleteEquipment]
  );

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
    <div className="min-h-screen animated-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Glass Header */}
        <Header
          email={user.email || ""}
          isAdmin={isAdmin}
          onNavigateAdmin={handleNavigateAdmin}
          onSignOut={handleSignOut}
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-1.5 h-auto grid w-full grid-cols-2 lg:grid-cols-4 gap-1">
            <TabsTrigger
              value="dashboard"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Inventaire</span>
            </TabsTrigger>
            <TabsTrigger
              value="scanner"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scanner</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="admin"
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <Dashboard equipment={equipment} />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6 animate-fade-in">
            {/* Action Buttons */}
            <div className="glass-card p-4 flex flex-wrap gap-3">
              <Button
                onClick={() => setShowForm(true)}
                className="glass-button gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="gap-2 border-border/50 hover:bg-secondary/50"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
              <ImportCSVButton />
              <Button
                variant="outline"
                onClick={handleGenerateQRSheet}
                className="gap-2 border-border/50 hover:bg-secondary/50"
              >
                <FileText className="h-4 w-4" />
                Générer étiquettes QR
              </Button>
            </div>

            {isLoading ? (
              <div className="glass-card p-12 flex justify-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
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
          <TabsContent value="scanner" className="space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <Button
                onClick={() => setShowScanner(!showScanner)}
                size="lg"
                className="glass-button gap-2"
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
            <TabsContent value="admin" className="space-y-6 animate-fade-in">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>

        {/* Equipment Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl">
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
