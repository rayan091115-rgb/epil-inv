import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { groqService } from "@/lib/groq-service";
import { aiEngine } from "@/lib/ai-engine";
import { supabase } from "@/integrations/supabase/client";
import { 
  Camera, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Cpu, 
  Barcode,
  History,
  Sparkles,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface ScanResult {
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  details: string | null;
}

interface DetectionBox {
  label: string;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
  score: number;
}

export const AIScanner = () => {
  const webcamRef = useRef<Webcam>(null);
  const viewBoxRef = useRef<HTMLDivElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [matchedEquipment, setMatchedEquipment] = useState<any>(null);
  const [isSearchingDB, setIsSearchingDB] = useState(false);
  const [detections, setDetections] = useState<DetectionBox[]>([]);
  const [isAIEngineReady, setIsAIEngineReady] = useState(false);

  // Initialize AI Engine
  useEffect(() => {
    aiEngine.init().then(() => setIsAIEngineReady(true));
  }, []);

  // Detection Loop
  useEffect(() => {
    if (!isAIEngineReady || isAnalyzing) return;

    let animationId: number;
    let frameCount = 0;

    const runDetection = async () => {
      if (webcamRef.current && webcamRef.current.video?.readyState === 4) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          // Use Precision (RF-DETR) every 30 frames (~0.5-1s) to confirm hardware
          const usePrecision = frameCount % 30 === 0;
          const results = await aiEngine.detect(imageSrc, usePrecision);
          
          setDetections(results.map(r => ({ ...r, isPrecision: usePrecision })));
        }
      }
      frameCount++;
      animationId = requestAnimationFrame(runDetection);
    };

    runDetection();
    return () => cancelAnimationFrame(animationId);
  }, [isAIEngineReady, isAnalyzing]);

  // Capture & Identify via Groq
  const captureAndIdentify = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsAnalyzing(true);
    setLastResult(null);
    setMatchedEquipment(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Impossible de capturer l'image");

      const result = await groqService.identifyEquipment(imageSrc);
      setLastResult(result);

      // Search in DB
      if (result.serialNumber || result.model) {
        setIsSearchingDB(true);
        const { data } = await supabase
          .from("equipment")
          .select("*")
          .or(`serial_number.eq.${result.serialNumber},model.ilike.%${result.model}%`)
          .maybeSingle();

        if (data) {
          setMatchedEquipment(data);
          toast.success("Équipement trouvé dans l'inventaire !");
        } else {
          toast.info("Identification réussie - Non présent dans l'inventaire");
        }
        setIsSearchingDB(false);
      }

    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'identification");
    } finally {
      setIsAnalyzing(false);
    }
  }, [webcamRef]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 max-w-7xl mx-auto">
      {/* Viewfinder Section */}
      <Card ref={viewBoxRef} className="overflow-hidden border-0 shadow-2xl bg-black rounded-3xl relative group">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover aspect-video scale-105 group-hover:scale-100 transition-transform duration-700"
          videoConstraints={{ facingMode: "environment" }}
        />

        {/* Real-time Bounding Boxes Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {detections.map((det, idx) => (
              <motion.div
                key={`${det.label}-${idx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  left: `${det.box.xmin}%`,
                  top: `${det.box.ymin}%`,
                  width: `${det.box.xmax - det.box.xmin}%`,
                  height: `${det.box.ymax - det.box.ymin}%`
                }}
                exit={{ opacity: 0 }}
                className={`absolute border-2 rounded-lg backdrop-blur-[1px] transition-colors duration-300 ${
                  (det as any).isPrecision 
                    ? "border-green-400 bg-green-400/10 shadow-[0_0_15px_rgba(74,222,128,0.5)]" 
                    : "border-primary/60 bg-primary/5"
                }`}
              >
                <div className={`absolute -top-6 left-0 text-[10px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider transition-colors ${
                  (det as any).isPrecision ? "bg-green-500 shadow-md" : "bg-primary/90"
                }`}>
                  {(det as any).isPrecision ? "CONFIRMÉ: " : ""}{det.label} {Math.round(det.score * 100)}%
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Laser Beam Effect during analysis */}
        {isAnalyzing && (
          <motion.div 
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(234,179,8,0.8)] z-20"
          />
        )}

        {/* UI Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          <div className="flex justify-between items-start">
            {!isAIEngineReady && (
              <Badge variant="secondary" className="bg-amber-500/20 text-white border-0">
                Initialisation IA...
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="bg-black/40 border-white/20 text-white hover:bg-black/60 glass-card-premium pointer-events-auto"
              onClick={() => {
                if (viewBoxRef.current) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    viewBoxRef.current.requestFullscreen();
                  }
                }
              }}
            >
              Mode Plein Écran
            </Button>
          </div>

          <div className="flex flex-col items-center gap-8 pointer-events-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-card-premium p-5 text-white text-center text-xs max-w-[300px] bg-black/50 leading-relaxed"
            >
              <Sparkles className="h-5 w-5 mx-auto mb-2 text-primary animate-spin-slow" />
              Cadrez l'équipement. L'IA localise et extrait automatiquement les métadonnées techniques.
            </motion.div>

            <Button
              size="lg"
              className="rounded-full shadow-[0_0_40px_rgba(234,179,8,0.4)] gap-4 px-12 py-10 text-2xl font-black bg-primary hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-300 border-t-2 border-white/20"
              onClick={captureAndIdentify}
              disabled={isAnalyzing || !isAIEngineReady || !import.meta.env.VITE_GROQ_API_KEY}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8" />
                  SCANNER
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent/20 rounded-3xl overflow-hidden min-h-[400px]">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Détails de l'Analyse
              </div>
              {isAnalyzing && <Badge variant="outline" className="animate-pulse bg-primary/10 border-primary/20">Kimi K2 Analysis...</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {!lastResult && !isAnalyzing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground opacity-30" />
                  </div>
                  <p className="text-muted-foreground font-medium">En attente de capture</p>
                </motion.div>
              ) : isAnalyzing ? (
                <div className="space-y-6 pt-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                  </div>
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-black/20 border shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Marque</p>
                      <p className="text-xl font-bold text-primary truncate">{lastResult?.brand || "-"}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-black/20 border shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Modèle</p>
                      <p className="text-xl font-bold truncate">{lastResult?.model || "-"}</p>
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-primary/5 border-2 border-primary/20 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-colors">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mb-1">Numéro de Série (OCR)</p>
                      <p className="font-mono text-lg font-bold">{lastResult?.serialNumber || "Non détecté"}</p>
                    </div>
                    <Barcode className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>

                  {matchedEquipment ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-6 rounded-3xl bg-green-500/10 border-2 border-green-500/30 flex items-start gap-4"
                    >
                      <div className="p-3 rounded-full bg-green-500 shadow-lg">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-green-700 dark:text-green-400">MATCH TROUVÉ</h4>
                        <p className="text-lg font-bold">{matchedEquipment.name}</p>
                        <p className="text-xs opacity-70">Enregistré: {new Date(matchedEquipment.created_at).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-3">
                          <Badge className="bg-green-500 border-0">{matchedEquipment.status}</Badge>
                          <Badge variant="outline" className="border-green-500/50">{matchedEquipment.category}</Badge>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="p-6 rounded-3xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-sm font-medium">
                      Aucune correspondance exacte dans la base
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
