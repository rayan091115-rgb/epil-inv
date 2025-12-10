import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { csvUtils } from "@/lib/csv-utils";
import { useBatchEquipment } from "@/hooks/useBatchEquipment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

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
        throw new Error("Aucune donnée valide trouvée dans le fichier CSV");
      }

      setProgress(70);
      await batchImport(parsed);
      setProgress(100);

      // Small delay before closing
      setTimeout(() => {
        setShowProgress(false);
        setProgress(0);
      }, 1000);
    } catch (error: any) {
      console.error("CSV Import error:", error);
      setShowProgress(false);
      setProgress(0);
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        disabled={isImporting}
        onClick={() => inputRef.current?.click()}
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Importer CSV
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Import en cours...
            </DialogTitle>
            <DialogDescription>
              Veuillez patienter pendant l'import des données
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {progress < 30 && "Lecture du fichier..."}
              {progress >= 30 && progress < 50 && "Analyse des données..."}
              {progress >= 50 && progress < 70 && "Préparation de l'import..."}
              {progress >= 70 && progress < 100 && "Enregistrement en base de données..."}
              {progress === 100 && "Import terminé !"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
