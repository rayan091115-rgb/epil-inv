import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { DenseToolbar, PageHeader, PageShell, SurfaceBadge } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { AdminPanel } from "@/components/AdminPanel";
import { AIScanner } from "@/components/AIScanner";
import { Dashboard } from "@/components/Dashboard";
import { EquipmentDetailModal } from "@/components/EquipmentDetailModal";
import { EquipmentForm } from "@/components/EquipmentForm";
import { EquipmentList } from "@/components/EquipmentList";
import { ImportCSVButton } from "@/components/ImportCSVButton";
import { QRScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useEquipment } from "@/hooks/useEquipment";
import { useUserRole } from "@/hooks/useUserRole";
import { csvUtils } from "@/lib/csv-utils";
import { generateA4QRSheet } from "@/lib/pdf-generator";
import { Equipment } from "@/types/equipment";

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
    <PageHeader
      title="Inventaire CIEL"
      description="Pilotage du parc, consultation rapide et outils de scan dans une interface plus claire et plus stable."
      icon={Icons.cube}
      meta={
        <>
          <SurfaceBadge>Session active</SurfaceBadge>
          <SurfaceBadge className="normal-case tracking-normal">{email}</SurfaceBadge>
          {isAdmin ? <SurfaceBadge className="normal-case tracking-normal">Admin</SurfaceBadge> : null}
        </>
      }
      actions={
        <>
          {isAdmin ? (
            <Button variant="outline" size="sm" onClick={onNavigateAdmin}>
              <Icons.admin className="h-[18px] w-[18px]" />
              Espace admin
            </Button>
          ) : null}
          <Button size="sm" onClick={onSignOut}>
            <Icons.logout className="h-[18px] w-[18px]" />
            Deconnexion
          </Button>
        </>
      }
    />
  ),
);

Header.displayName = "Header";

const LoadingSpinner = () => (
  <PageShell className="flex items-center justify-center">
    <div className="glass-card flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-foreground/15 border-t-foreground" />
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">Chargement</p>
        <p className="text-sm text-muted-foreground">Preparation de l interface.</p>
      </div>
    </div>
  </PageShell>
);

const tabItems = [
  { value: "dashboard", label: "Tableau de bord", icon: Icons.activity },
  { value: "inventory", label: "Inventaire", icon: Icons.inventory },
  { value: "scanner", label: "Scanner QR", icon: Icons.qr },
  { value: "ai-scanner", label: "Scanner IA", icon: Icons.cpu },
] as const;

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
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, navigate, user]);

  const handleAddEquipment = useCallback(
    async (data: Partial<Equipment>) => {
      try {
        await addEquipmentAsync(data);
        setShowForm(false);
        setEditingEquipment(null);
        toast.success("Materiel ajoute avec succes");
      } catch (error) {
        console.error("[Index] Add equipment error:", error);
        toast.error("Erreur pendant l ajout du materiel");
      }
    },
    [addEquipmentAsync],
  );

  const handleUpdateEquipment = useCallback(
    (data: Partial<Equipment>) => {
      if (!editingEquipment) return;

      try {
        updateEquipment({ id: editingEquipment.id, data });
        toast.success("Materiel mis a jour");
      } catch (error) {
        console.error("[Index] Update equipment error:", error);
        toast.error("Erreur pendant la mise a jour");
      }

      setEditingEquipment(null);
      setShowForm(false);
    },
    [editingEquipment, updateEquipment],
  );

  const handleDeleteEquipment = useCallback(
    (id: string) => {
      deleteEquipment(id);
    },
    [deleteEquipment],
  );

  const handleExportCSV = useCallback(() => {
    csvUtils.downloadCSV(equipment);
    toast.success("Inventaire exporte en CSV");
  }, [equipment]);

  const handleGenerateQRSheet = useCallback(async () => {
    if (equipment.length === 0) {
      toast.error("Ajoutez du materiel avant de generer les etiquettes");
      return;
    }

    try {
      await generateA4QRSheet(equipment);
      toast.success("Planche QR generee");
    } catch (error) {
      console.error("[Index] QR sheet generation error:", error);
      toast.error("Impossible de generer le PDF");
    }
  }, [equipment]);

  const handleEquipmentClick = useCallback((item: Equipment) => {
    setSelectedEquipment(item);
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

  if (!user) {
    navigate("/auth", { replace: true });
    return <LoadingSpinner />;
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Header
          email={user.email || ""}
          isAdmin={isAdmin}
          onNavigateAdmin={handleNavigateAdmin}
          onSignOut={handleSignOut}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-5">
            {tabItems.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="min-h-[52px] gap-2 text-left">
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
            {isAdmin ? (
              <TabsTrigger value="admin" className="min-h-[52px] gap-2 text-left">
                <Icons.admin className="h-[18px] w-[18px]" />
                <span>Admin</span>
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="dashboard" className="animate-fade-in">
            <Dashboard equipment={equipment} isLoading={isLoading} onAddEquipment={() => setShowForm(true)} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 animate-fade-in">
            <DenseToolbar>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setShowForm(true)}>
                  <Icons.plus className="h-[18px] w-[18px]" />
                  Ajouter
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Icons.download className="h-[18px] w-[18px]" />
                  Exporter CSV
                </Button>
                <ImportCSVButton />
                <Button variant="outline" onClick={handleGenerateQRSheet}>
                  <Icons.qr className="h-[18px] w-[18px]" />
                  Etiquettes QR
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SurfaceBadge>{equipment.length} equipements</SurfaceBadge>
                <SurfaceBadge>{isLoading ? "Synchro..." : "Donnees a jour"}</SurfaceBadge>
              </div>
            </DenseToolbar>

            <EquipmentList
              equipment={equipment}
              onEdit={(item) => {
                setEditingEquipment(item);
                setShowForm(true);
              }}
              onDelete={handleDeleteEquipment}
              onEquipmentClick={handleEquipmentClick}
            />
          </TabsContent>

          <TabsContent value="scanner" className="space-y-4 animate-fade-in">
            <DenseToolbar>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">Verification par QR</p>
                <p className="text-sm text-muted-foreground">
                  Ouvrez le flux camera puis controlez le materiel scanne en direct.
                </p>
              </div>
              <Button onClick={() => setShowScanner((prev) => !prev)} size="lg">
                <Icons.camera className="h-[18px] w-[18px]" />
                {showScanner ? "Fermer le scanner" : "Ouvrir le scanner"}
              </Button>
            </DenseToolbar>
            {showScanner ? (
              <div className="mx-auto max-w-5xl">
                <QRScanner equipment={equipment} />
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="ai-scanner" className="animate-fade-in">
            <AIScanner />
          </TabsContent>

          {isAdmin ? (
            <TabsContent value="admin" className="animate-fade-in">
              <AdminPanel />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingEquipment(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEquipment ? "Modifier le materiel" : "Ajouter du materiel"}</DialogTitle>
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
        onOpenChange={(open) => {
          if (!open) setSelectedEquipment(null);
        }}
      />
    </PageShell>
  );
};

export default Index;
