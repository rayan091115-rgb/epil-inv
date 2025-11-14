import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
}

export const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>("");

  const startScanning = async () => {
    try {
      setError("");
      const html5QrCode = new Html5Qrcode("barcode-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Ignore errors during scanning
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      setError("Impossible d'accéder à la caméra");
      console.error("Error starting scanner:", err);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
          setIsScanning(false);
        })
        .catch((err) => console.error("Error stopping scanner:", err));
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="relative">
      {!isScanning ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startScanning}
          title="Scanner un code-barre"
        >
          <Camera className="h-4 w-4" />
        </Button>
      ) : (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-background p-4 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scanner le code-barre</h3>
              <Button variant="ghost" size="icon" onClick={stopScanning}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div id="barcode-reader" className="w-full"></div>
            {error && <p className="text-destructive mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};
