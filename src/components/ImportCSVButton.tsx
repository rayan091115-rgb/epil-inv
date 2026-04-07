import { useRef, useState } from "react";

import { Icons } from "@/components/app/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useBatchEquipment } from "@/hooks/useBatchEquipment";
import { csvUtils } from "@/lib/csv-utils";

export function ImportCSVButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const { batchImport, isImporting } = useBatchEquipment();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowProgress(true);
    setProgress(10);

    try {
      const content = await file.text();
      setProgress(30);

      const parsed = csvUtils.parseCSV(content);
      setProgress(50);

      if (parsed.length === 0) {
        throw new Error("Aucune donnee valide trouvee dans le fichier CSV");
      }

      setProgress(70);
      await batchImport(parsed);
      setProgress(100);

      setTimeout(() => {
        setShowProgress(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error("CSV import error:", error);
      setShowProgress(false);
      setProgress(0);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <Button variant="outline" disabled={isImporting} onClick={() => inputRef.current?.click()}>
        {isImporting ? <Icons.refresh className="h-[18px] w-[18px] animate-spin" /> : <Icons.upload className="h-[18px] w-[18px]" />}
        Importer CSV
      </Button>

      <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.refresh className="h-[18px] w-[18px] animate-spin" />
              Import en cours
            </DialogTitle>
            <DialogDescription>Le fichier est traite puis injecte dans la base.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {progress < 30 && "Lecture du fichier..."}
              {progress >= 30 && progress < 50 && "Analyse des donnees..."}
              {progress >= 50 && progress < 70 && "Preparation de l import..."}
              {progress >= 70 && progress < 100 && "Enregistrement en base..."}
              {progress === 100 && "Import termine"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
