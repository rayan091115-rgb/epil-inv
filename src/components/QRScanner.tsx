import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ScannedItem {
  code: string;
  timestamp: string;
}

export const QRScanner = () => {
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
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Anti-doublon : vérifier si déjà scanné récemment
          const alreadyScanned = scannedItems.some(
            (item) => item.code === decodedText && 
            Date.now() - new Date(item.timestamp).getTime() < 3000
          );

          if (!alreadyScanned) {
            setScannedItems((prev) => [
              ...prev,
              { code: decodedText, timestamp: new Date().toISOString() },
            ]);
            toast({
              title: "QR Code détecté",
              description: `Code: ${decodedText}`,
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
      "Code,Timestamp",
      ...scannedItems.map((item) => `"${item.code}","${item.timestamp}"`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
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
          Scannez les QR codes du matériel pour vérifier la présence
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
          style={{ minHeight: isScanning ? "400px" : "0" }}
        />

        {scannedItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Éléments scannés ({scannedItems.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg border p-3">
              {scannedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded bg-muted"
                >
                  <span className="font-mono text-sm">{item.code}</span>
                  <Badge variant="outline">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
