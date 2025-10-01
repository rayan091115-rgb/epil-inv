import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Equipment } from "@/types/equipment";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ScannedItem {
  code: string;
  timestamp: string;
  equipment: Equipment | null;
  found: boolean;
}

interface QRScannerProps {
  equipment: Equipment[];
}

export const QRScanner = ({ equipment }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: { width: 400, height: 400 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Anti-doublon renforcé : vérifier si déjà scanné récemment (5 secondes)
          const alreadyScanned = scannedItems.some(
            (item) => 
              item.code === decodedText && 
              Date.now() - new Date(item.timestamp).getTime() < 5000
          );

          if (!alreadyScanned) {
            // Extraire l'ID de l'équipement depuis l'URL du QR code
            const equipmentId = decodedText.split('/').pop();
            const foundEquipment = equipment.find((e) => e.id === equipmentId);
            
            setScannedItems((prev) => [
              ...prev,
              { 
                code: decodedText, 
                timestamp: new Date().toISOString(),
                equipment: foundEquipment || null,
                found: !!foundEquipment,
              },
            ]);
            
            toast({
              title: foundEquipment ? "Équipement détecté" : "QR Code inconnu",
              description: foundEquipment 
                ? `${foundEquipment.category} - ${foundEquipment.poste}` 
                : `Code: ${decodedText}`,
            });
          }
        },
        (error) => {
          // Ignorer les erreurs de scanning silencieusement
        }
      );

      setIsScanning(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la caméra",
        variant: "destructive",
      });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  const exportResults = () => {
    const csv = [
      "Poste,Catégorie,Marque,Modèle,Numéro de série,État,Date d'achat,Fin garantie,Notes,Présent,Code,Horodatage",
      ...scannedItems.map((item) => {
        const eq = item.equipment;
        return `"${eq?.poste || 'Inconnu'}","${eq?.category || ''}","${eq?.marque || ''}","${eq?.modele || ''}","${eq?.numeroSerie || ''}","${eq?.etat || ''}","${eq?.dateAchat || ''}","${eq?.finGarantie || ''}","${eq?.notes || ''}","${item.found ? 'Oui' : 'Non'}","${item.code}","${item.timestamp}"`;
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scan_results_${new Date().toISOString().split("T")[0]}.csv`;
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
    <Card>
      <CardHeader>
        <CardTitle>Scanner QR</CardTitle>
        <CardDescription>
          Scannez les QR codes ou codes-barres du matériel pour vérifier la présence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Démarrer le scan
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="flex-1">
              <CameraOff className="mr-2 h-4 w-4" />
              Arrêter le scan
            </Button>
          )}
          {scannedItems.length > 0 && (
            <Button onClick={exportResults} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          )}
        </div>

        <div
          id="qr-reader"
          className="rounded-lg overflow-hidden"
          style={{ minHeight: isScanning ? "500px" : "0" }}
        />

        {scannedItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">
              Éléments scannés ({scannedItems.length})
            </h3>
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
                    <TableHead>Date achat</TableHead>
                    <TableHead>Garantie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Heure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedItems.map((item, index) => {
                    const eq = item.equipment;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {eq?.poste || "Inconnu"}
                        </TableCell>
                        <TableCell>{eq?.category || "-"}</TableCell>
                        <TableCell>{eq?.marque || "-"}</TableCell>
                        <TableCell>{eq?.modele || "-"}</TableCell>
                        <TableCell>{eq?.numeroSerie || "-"}</TableCell>
                        <TableCell>
                          {eq?.etat ? (
                            <Badge 
                              variant={
                                eq.etat === "OK" 
                                  ? "default" 
                                  : eq.etat === "Panne" 
                                  ? "secondary" 
                                  : "destructive"
                              }
                            >
                              {eq.etat}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {eq?.dateAchat 
                            ? new Date(eq.dateAchat).toLocaleDateString() 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {eq?.finGarantie 
                            ? new Date(eq.finGarantie).toLocaleDateString() 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.found ? "default" : "destructive"}>
                            {item.found ? "Présent" : "Non trouvé"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
