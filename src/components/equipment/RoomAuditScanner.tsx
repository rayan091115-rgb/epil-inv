import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, CameraOff, Download, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Equipment } from "@/types/equipment";
import { useLocations } from "@/hooks/useLocations";

interface AuditResult {
  found: Equipment[];
  missing: Equipment[];
  displaced: Equipment[];
}

interface RoomAuditScannerProps {
  equipment: Equipment[];
}

export const RoomAuditScanner = ({ equipment }: RoomAuditScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [scannedIds, setScannedIds] = useState<Set<string>>(new Set());
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { locations } = useLocations();

  const startAudit = async () => {
    if (!selectedLocation) {
      toast({
        title: "Sélectionnez un emplacement",
        description: "Vous devez choisir une salle avant de commencer l'audit",
        variant: "destructive",
      });
      return;
    }

    setScannedIds(new Set());
    setAuditResult(null);

    try {
      const html5QrCode = new Html5Qrcode("audit-qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: { width: 400, height: 400 },
        },
        (decodedText) => {
          const equipmentId = decodedText.split("/").pop();
          if (equipmentId && !scannedIds.has(equipmentId)) {
            setScannedIds((prev) => new Set(prev).add(equipmentId));
            const foundEquipment = equipment.find((e) => e.id === equipmentId);
            toast({
              title: foundEquipment ? "Scanné ✓" : "Code inconnu",
              description: foundEquipment?.poste || equipmentId,
            });
          }
        },
        () => {}
      );

      setIsScanning(true);
    } catch (error) {
      toast({
        title: "Erreur caméra",
        description: "Impossible d'accéder à la caméra",
        variant: "destructive",
      });
    }
  };

  const stopAudit = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        generateReport();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  const generateReport = () => {
    const expectedInRoom = equipment.filter((e) => e.locationId === selectedLocation);
    const scannedEquipment = equipment.filter((e) => scannedIds.has(e.id));

    const found = scannedEquipment.filter((e) => e.locationId === selectedLocation);
    const missing = expectedInRoom.filter((e) => !scannedIds.has(e.id));
    const displaced = scannedEquipment.filter((e) => e.locationId !== selectedLocation);

    setAuditResult({ found, missing, displaced });

    toast({
      title: "Audit terminé",
      description: `${found.length} trouvés, ${missing.length} manquants, ${displaced.length} déplacés`,
    });
  };

  const exportAudit = () => {
    if (!auditResult) return;

    const csv = [
      "Statut,Poste,Catégorie,Emplacement actuel",
      ...auditResult.found.map(
        (e) => `Trouvé,"${e.poste}","${e.category}","${selectedLocation}"`
      ),
      ...auditResult.missing.map(
        (e) => `Manquant,"${e.poste}","${e.category}","${selectedLocation}"`
      ),
      ...auditResult.displaced.map(
        (e) => `Déplacé,"${e.poste}","${e.category}","${e.locationId || "Non assigné"}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_${selectedLocation}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit de Salle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sélectionner un emplacement</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une salle..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startAudit} disabled={!selectedLocation}>
                <Camera className="h-4 w-4 mr-2" />
                Démarrer l'audit
              </Button>
            ) : (
              <Button onClick={stopAudit} variant="destructive">
                <CameraOff className="h-4 w-4 mr-2" />
                Terminer l'audit
              </Button>
            )}

            {auditResult && (
              <Button onClick={exportAudit} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            )}
          </div>

          <div
            id="audit-qr-reader"
            className={isScanning ? "border rounded-lg overflow-hidden" : "hidden"}
          />

          {isScanning && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Équipements scannés : {scannedIds.size}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {auditResult && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trouvés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {auditResult.found.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Présents dans la salle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Manquants</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {auditResult.missing.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Non scannés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Déplacés</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {auditResult.displaced.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hors emplacement
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
