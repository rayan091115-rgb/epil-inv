import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

import { DenseToolbar, SectionPanel, SurfaceBadge } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Equipment } from "@/types/equipment";

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
          qrbox: { width: 380, height: 380 },
          aspectRatio: 1,
        },
        (decodedText) => {
          const alreadyScanned = scannedItems.some(
            (item) => item.code === decodedText && Date.now() - new Date(item.timestamp).getTime() < 5000,
          );

          if (alreadyScanned) return;

          const equipmentId = decodedText.includes("/")
            ? decodedText.split("/").filter(Boolean).pop() || decodedText
            : decodedText;

          const foundEquipment = equipment.find((item) => item.id === equipmentId);

          setScannedItems((previous) => [
            ...previous,
            {
              code: decodedText,
              timestamp: new Date().toISOString(),
              equipment: foundEquipment || null,
              found: !!foundEquipment,
            },
          ]);

          toast({
            title: foundEquipment ? "Equipement detecte" : "QR code inconnu",
            description: foundEquipment ? `${foundEquipment.category} - ${foundEquipment.poste}` : `Code: ${decodedText}`,
          });
        },
        () => {},
      );

      setIsScanning(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d acceder a la camera",
        variant: "destructive",
      });
    }
  };

  const stopScanning = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      setIsScanning(false);
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  };

  const exportResults = () => {
    const csv = [
      "Poste,Categorie,Marque,Modele,Numero de serie,Etat,Date achat,Fin garantie,Notes,Present,Code,Horodatage",
      ...scannedItems.map((item) => {
        const current = item.equipment;
        return `"${current?.poste || "Inconnu"}","${current?.category || ""}","${current?.marque || ""}","${current?.modele || ""}","${current?.numeroSerie || ""}","${current?.etat || ""}","${current?.dateAchat || ""}","${current?.finGarantie || ""}","${current?.notes || ""}","${item.found ? "Oui" : "Non"}","${item.code}","${item.timestamp}"`;
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
    <SectionPanel
      title="Scanner QR"
      description="Controle terrain avec camera, liste d elements trouves et export direct."
      action={
        <div className="flex items-center gap-2">
          {scannedItems.length > 0 ? <SurfaceBadge>{scannedItems.length} scan(s)</SurfaceBadge> : null}
          {scannedItems.length > 0 ? (
            <Button onClick={exportResults} variant="outline" size="sm">
              <Icons.download className="h-[18px] w-[18px]" />
              Exporter
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5">
        <DenseToolbar className="bg-secondary/30 shadow-none">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">{isScanning ? "Scan en cours" : "Pret a scanner"}</p>
            <p className="text-sm text-muted-foreground">
              Orientez la camera vers un QR code ou un code-barres pour verifier la presence du materiel.
            </p>
          </div>
          {!isScanning ? (
            <Button onClick={startScanning}>
              <Icons.camera className="h-[18px] w-[18px]" />
              Demarrer
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive">
              <Icons.close className="h-[18px] w-[18px]" />
              Arreter
            </Button>
          )}
        </DenseToolbar>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-border/70 bg-card p-4 shadow-[0_16px_40px_rgba(16,24,40,0.06)]">
            <div className="grid-surface relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-border/80 bg-background/80">
              <div
                id="qr-reader"
                className="w-full"
                style={{ minHeight: isScanning ? "460px" : "0" }}
              />
              {!isScanning ? (
                <div className="pointer-events-none absolute text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary text-foreground">
                    <Icons.qr className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Le flux camera apparaitra ici</p>
                  <p className="mt-1 text-sm text-muted-foreground">Activez le scan pour lancer la detection.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[24px] border border-border/70 bg-card p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Total scanne</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{scannedItems.length}</p>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-card p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Trouves</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {scannedItems.filter((item) => item.found).length}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poste</TableHead>
                    <TableHead>Etat</TableHead>
                    <TableHead>Heure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                        Aucun scan pour le moment.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scannedItems
                      .slice()
                      .reverse()
                      .map((item, index) => (
                        <TableRow key={`${item.code}-${index}`}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{item.equipment?.poste || "Code inconnu"}</p>
                              <p className="text-xs text-muted-foreground">{item.code}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={item.found ? "status-ok" : "status-danger"}>
                              {item.found ? "Present" : "Non trouve"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(item.timestamp).toLocaleTimeString()}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </SectionPanel>
  );
};
