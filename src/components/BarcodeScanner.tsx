import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

import { Icons } from "@/components/app/icons";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
}

export const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanning = async () => {
    try {
      setError("");
      const html5QrCode = new Html5Qrcode("barcode-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 100 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {},
      );

      setIsScanning(true);
    } catch (currentError) {
      setError("Impossible d acceder a la camera");
      console.error("Error starting scanner:", currentError);
    }
  };

  const stopScanning = () => {
    if (!scannerRef.current) return;

    scannerRef.current
      .stop()
      .then(() => {
        scannerRef.current = null;
        setIsScanning(false);
      })
      .catch((currentError) => console.error("Error stopping scanner:", currentError));
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
        <Button type="button" variant="outline" size="icon" onClick={startScanning} title="Scanner un code-barres">
          <Icons.camera className="h-[18px] w-[18px]" />
        </Button>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-border/70 bg-background p-5 shadow-[0_28px_80px_rgba(16,24,40,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Scanner le code-barres</h3>
              <Button variant="ghost" size="icon" onClick={stopScanning} aria-label="Fermer le scanner">
                <Icons.close className="h-[18px] w-[18px]" />
              </Button>
            </div>
            <div id="barcode-reader" className="w-full overflow-hidden rounded-[20px]" />
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
};
