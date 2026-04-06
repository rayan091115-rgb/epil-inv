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
import { AIScanner } from "@/components/AIScanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, LogOut, ScanLine, FileText, LayoutDashboard, Shield, Sparkles, Package } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ── Topbar ──────────────────────────────────────────────────────────────────
const Topbar = memo(({
  email,
  isAdmin,
  onSignOut,
}: {
  email: string;
  isAdmin: boolean;
  onSignOut: () => void;
}) => (
  <header className="ln-topbar">
    {/* Brand */}
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "#5e6ad2" }}
      >
        <Package className="w-3.5 h-3.5 text-white" />
      </div>
      <span
        className="text-sm font-semibold tracking-tight"
        style={{ color: "#1a1a1e", letterSpacing: "-0.28px", fontWeight: 590 }}
      >
        Inventaire CIEL
      </span>
      {isAdmin && (
        <span
          className="text-xs px-2 py-0.5 rounded-full border"
          style={{
            fontSize: "11px",
            fontWeight: 510,
            color: "#5e6ad2",
            background: "rgba(94,106,210,0.08)",
            border: "1px solid rgba(94,106,210,0.2)",
            letterSpacing: "-0.1px",
          }}
        >
          Admin
        </span>
      )}
    </div>

    {/* Right side */}
    <div className="flex items-center gap-3">
      <span
        className="text-xs hidden sm:block"
        style={{ color: "#8a8f98", letterSpacing: "-0.13px", fontWeight: 400 }}
      >
        {email}
      </span>
      <button
        onClick={onSignOut}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-all duration-100"
        style={{
          color: "#62666d",
          background: "#ffffff",
          border: "1px solid #e6e6e6",
          fontWeight: 510,
          letterSpacing: "-0.13px",
          fontSize: "13px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f5";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
        }}
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Déconnexion</span>
      </button>
    </div>
  </header>
));
Topbar.displayName = "Topbar";

// ── Loading Spinner ──────────────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: "#f7f8f8" }}
  >
    <div
      className="flex flex-col items-center gap-4 p-10 rounded-xl"
      style={{
        background: "#ffffff",
        border: "1px solid #e6e6e6",
        boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 4px 0px",
      }}
    >
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "#e6e6e6", borderTopColor: "#5e6ad2" }}
      />
      <p className="text-sm" style={{ color: "#62666d", fontWeight: 510, letterSpacing: "-0.13px" }}>
        Chargement…
      </p>
    </div>
  </div>
);

// ── Main page ────────────────────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { equipment, isLoading, addEquipmentAsync, updateEquipment, deleteEquipment } = useEquipment(user);
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const handleAddEquipment = useCallback(async (data: Partial<Equipment>) => {
    try {
      await addEquipmentAsync(data);
      setShowForm(false);
      setEditingEquipment(null);
      toast.success("Matériel ajouté avec succès");
    } catch (error) {
      console.error("[Index] Add equipment error:", error);
      toast.error("Erreur lors de l'ajout du matériel");
    }
  }, [addEquipmentAsync]);

  const handleUpdateEquipment = useCallback((data: Partial<Equipment>) => {
    if (!editingEquipment) return;
    try {
      updateEquipment({ id: editingEquipment.id, data });
      toast.success("Matériel mis à jour avec succès");
    } catch (error) {
      console.error("[Index] Update equipment error:", error);
      toast.error("Erreur lors de la mise à jour du matériel");
    }
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
      toast.error("Ajoutez des équipements avant de générer les étiquettes");
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

  const handleEquipmentClick = useCallback((eq: Equipment) => {
    setSelectedEquipment(eq);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  if (authLoading || roleLoading) return <LoadingSpinner />;
  if (!user) {
    navigate("/auth", { replace: true });
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#f7f8f8" }}>
      <Topbar
        email={user.email || ""}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
      />

      {/* Page content */}
      <div className="max-w-[1280px] mx-auto px-6 py-8">

        {/* Tab navigation avec bouton à droite */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <TabsList
              className="ln-tabs h-auto overflow-x-auto"
              style={{ display: "flex", flexWrap: "wrap", gap: "2px", border: "1px solid #e6e6e6", borderRadius: "8px", padding: "4px" }}
            >
              <TabsTrigger value="dashboard" className="ln-tab">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Tableau de bord</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="ln-tab">
                <FileText className="h-3.5 w-3.5" />
                <span>Inventaire</span>
              </TabsTrigger>
              <TabsTrigger value="scanner" className="ln-tab">
                <ScanLine className="h-3.5 w-3.5" />
                <span>Scanner QR</span>
              </TabsTrigger>
              <TabsTrigger value="ai-scanner" className="ln-tab">
                <Sparkles className="h-3.5 w-3.5" style={{ color: "#f79009" }} />
                <span>Scanner IA</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="ln-tab">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
            <button
              onClick={() => setShowForm(true)}
              className="ln-btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>

          {/* ── Dashboard ── */}
          <TabsContent value="dashboard" className="animate-fade-in">
            <Dashboard
              equipment={equipment}
              isLoading={isLoading}
              onAddEquipment={() => setShowForm(true)}
            />
          </TabsContent>

          {/* ── Inventory ── */}
          <TabsContent value="inventory" className="animate-fade-in space-y-4">
            {/* Toolbar */}
            <div
              className="flex flex-wrap gap-2 p-3 rounded-lg"
              style={{ background: "#ffffff", border: "1px solid #e6e6e6", boxShadow: "rgba(0,0,0,0.04) 0px 2px 4px 0px" }}
            >
              <button onClick={() => setShowForm(true)} className="ln-btn-primary">
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
              <button onClick={handleExportCSV} className="ln-btn-ghost">
                <Download className="w-3.5 h-3.5" />
                Exporter CSV
              </button>
              <ImportCSVButton />
              <button onClick={handleGenerateQRSheet} className="ln-btn-ghost">
                <FileText className="w-3.5 h-3.5" />
                Étiquettes QR
              </button>
            </div>

            {isLoading ? (
              <div
                className="flex justify-center p-12 rounded-lg"
                style={{ background: "#ffffff", border: "1px solid #e6e6e6" }}
              >
                <div
                  className="w-7 h-7 rounded-full border-2 animate-spin"
                  style={{ borderColor: "#e6e6e6", borderTopColor: "#5e6ad2" }}
                />
              </div>
            ) : (
              <EquipmentList
                equipment={equipment}
                onEdit={(eq) => { setEditingEquipment(eq); setShowForm(true); }}
                onDelete={handleDeleteEquipment}
                onEquipmentClick={handleEquipmentClick}
              />
            )}
          </TabsContent>

          {/* ── QR Scanner ── */}
          <TabsContent value="scanner" className="animate-fade-in space-y-4">
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="ln-btn-primary"
                style={{ padding: "10px 20px", fontSize: "14px" }}
              >
                <ScanLine className="w-4 h-4" />
                {showScanner ? "Fermer le scanner QR" : "Ouvrir le scanner QR"}
              </button>
            </div>
            {showScanner && (
              <div className="max-w-2xl mx-auto animate-fade-in">
                <QRScanner equipment={equipment} />
              </div>
            )}
          </TabsContent>

          {/* ── AI Scanner ── */}
          <TabsContent value="ai-scanner" className="animate-fade-in">
            <AIScanner />
          </TabsContent>

          {/* ── Admin ── */}
          {isAdmin && (
            <TabsContent value="admin" className="animate-fade-in">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* ── Equipment Form Dialog ── */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingEquipment(null);
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          style={{
            background: "#ffffff",
            border: "1px solid #e6e6e6",
            borderRadius: "12px",
            boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.12) 0px 8px 32px",
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontWeight: 590, letterSpacing: "-0.3px", color: "#1a1a1e", fontSize: "16px" }}
            >
              {editingEquipment ? "Modifier le matériel" : "Ajouter du matériel"}
            </DialogTitle>
          </DialogHeader>
          <EquipmentForm
            key={editingEquipment ? editingEquipment.id : "new-equipment"}
            equipment={editingEquipment}
            onSubmit={editingEquipment ? handleUpdateEquipment : handleAddEquipment}
            onCancel={() => { setShowForm(false); setEditingEquipment(null); }}
          />
        </DialogContent>
      </Dialog>

      <EquipmentDetailModal
        equipment={selectedEquipment}
        open={!!selectedEquipment}
        onOpenChange={(open) => !open && setSelectedEquipment(null)}
      />
    </div>
  );
};

export default Index;