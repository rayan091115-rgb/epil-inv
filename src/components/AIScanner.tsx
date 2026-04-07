import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { AnimatePresence, motion } from "motion/react";

import { DenseToolbar, SectionPanel, SurfaceBadge } from "@/components/app/primitives";
import { Icons } from "@/components/app/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { aiEngine } from "@/lib/ai-engine";
import { geminiService } from "@/lib/gemini-service";
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
  isPrecision?: boolean;
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
  const [engineError, setEngineError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    aiEngine
      .init()
      .then(() => setIsAIEngineReady(true))
      .catch((error) => setEngineError(error.message || "Erreur d initialisation"));
  }, []);

  useEffect(() => {
    if (!isAIEngineReady || isAnalyzing) return;

    let animationId = 0;
    let frameCount = 0;

    const runDetection = async () => {
      if (webcamRef.current && webcamRef.current.video?.readyState === 4) {
        const imageSrc = webcamRef.current.getScreenshot();

        if (imageSrc) {
          const usePrecision = frameCount % 30 === 0;
          const results = await aiEngine.detect(imageSrc, usePrecision);
          setDetections(results.map((item: any) => ({ ...item, isPrecision: usePrecision })));
        }
      }

      frameCount += 1;
      animationId = requestAnimationFrame(runDetection);
    };

    runDetection();
    return () => cancelAnimationFrame(animationId);
  }, [isAIEngineReady, isAnalyzing]);

  const captureAndIdentify = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsAnalyzing(true);
    setScanError(null);
    setLastResult(null);
    setMatchedEquipment(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot({ width: 1280, height: 720 });
      if (!imageSrc) throw new Error("Impossible de capturer l image");

      const result = await geminiService.identifyEquipment(imageSrc);
      setLastResult(result);

      const clauses: string[] = [];
      if (result.serialNumber) clauses.push(`numero_serie.eq.${result.serialNumber}`);
      if (result.model) clauses.push(`modele.ilike.%${result.model}%`);

      if (clauses.length > 0) {
        setIsSearchingDB(true);
        const { data } = await supabase.from("equipment").select("*").or(clauses.join(",")).maybeSingle();

        if (data) {
          setMatchedEquipment(data);
          toast.success("Equipement retrouve dans l inventaire");
        } else {
          toast.info("Identification effectuee, mais aucune correspondance exacte n a ete trouvee");
        }

        setIsSearchingDB(false);
      }
    } catch (error: any) {
      console.error("Identification error:", error);
      setScanError(error.message || "Erreur inconnue");
      toast.error(`Echec de l analyse: ${error.message || "image trop complexe"}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <SectionPanel
      title="Scanner IA"
      description="Capture guidee, detection locale et rapprochement avec l inventaire existant."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <SurfaceBadge>{isAIEngineReady ? "Moteur pret" : "Initialisation..."}</SurfaceBadge>
          <Button variant="outline" size="sm" onClick={() => setShowDiagnostics((value) => !value)}>
            <Icons.activity className="h-[18px] w-[18px]" />
            {showDiagnostics ? "Masquer le diagnostic" : "Voir le diagnostic"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <DenseToolbar className="bg-secondary/30 shadow-none">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Analyse guidee du materiel</p>
            <p className="text-sm text-muted-foreground">
              Cadrez la machine, capturez une image nette puis laissez l IA extraire marque, modele et numero de serie.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!viewBoxRef.current) return;
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  viewBoxRef.current.requestFullscreen();
                }
              }}
            >
              <Icons.activity className="h-[18px] w-[18px]" />
              Plein ecran
            </Button>
            <Button
              size="lg"
              onClick={captureAndIdentify}
              disabled={isAnalyzing || !isAIEngineReady || !import.meta.env.VITE_GEMINI_API_KEY}
            >
              {isAnalyzing ? (
                <>
                  <Icons.refresh className="h-[18px] w-[18px] animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Icons.camera className="h-[18px] w-[18px]" />
                  Capturer et identifier
                </>
              )}
            </Button>
          </div>
        </DenseToolbar>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Card ref={viewBoxRef} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="relative overflow-hidden rounded-[24px] border border-border/70 bg-foreground">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="aspect-video w-full bg-black object-contain"
                  videoConstraints={{ facingMode: "environment" }}
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[72%] w-[76%] rounded-[28px] border border-white/35" />
                </div>

                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <AnimatePresence>
                    {detections.map((detection, index) => (
                      <motion.div
                        key={`${detection.label}-${index}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          left: `${detection.box.xmin * 100}%`,
                          top: `${detection.box.ymin * 100}%`,
                          width: `${(detection.box.xmax - detection.box.xmin) * 100}%`,
                          height: `${(detection.box.ymax - detection.box.ymin) * 100}%`,
                        }}
                        exit={{ opacity: 0 }}
                        className={`absolute rounded-2xl border-2 ${
                          detection.isPrecision ? "border-emerald-400 bg-emerald-400/10" : "border-white/80 bg-white/5"
                        }`}
                      >
                        <div
                          className={`absolute -top-8 left-0 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${
                            detection.isPrecision ? "bg-emerald-500" : "bg-black/70"
                          }`}
                        >
                          {detection.label} {Math.round(detection.score * 100)}%
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {isAnalyzing ? <div className="scanner-laser" /> : null}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-white/10 bg-black/45 px-4 py-3 text-white backdrop-blur-sm">
                  <div>
                    <p className="text-sm font-medium">Cadrez la facade ou les etiquettes</p>
                    <p className="text-xs text-white/70">Le modele local cherche d abord la machine, puis l IA lit les metadonnees.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                      {detections.length} objet(s)
                    </Badge>
                    {!isAIEngineReady ? (
                      <Badge variant="outline" className="border-amber-300/40 bg-amber-300/10 text-amber-50">
                        Initialisation
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              {showDiagnostics ? (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Moteur</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{engineError ? "Erreur" : isAIEngineReady ? "Pret" : "Chargement"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Detections</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{detections.length} signal(s)</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Derniere erreur</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{scanError || engineError || "Aucune"}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="flex items-center justify-between gap-3 text-lg">
                <span className="inline-flex items-center gap-2">
                  <Icons.cpu className="h-[18px] w-[18px]" />
                  Resultat d analyse
                </span>
                {isSearchingDB ? <SurfaceBadge>Recherche en base...</SurfaceBadge> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <AnimatePresence mode="wait">
                {!lastResult && !isAnalyzing ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="rounded-[24px] border border-dashed border-border p-10 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-secondary text-foreground">
                        <Icons.search className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-foreground">En attente d une capture</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Lancez une analyse pour faire apparaitre les informations detectees.
                      </p>
                    </div>
                  </motion.div>
                ) : null}

                {isAnalyzing ? (
                  <div key="loading" className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                  </div>
                ) : null}

                {lastResult && !isAnalyzing ? (
                  <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Marque</p>
                          <p className="mt-2 text-xl font-semibold text-foreground">{lastResult.brand || "-"}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Modele</p>
                          <p className="mt-2 text-xl font-semibold text-foreground">{lastResult.model || "-"}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-background p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Numero de serie</p>
                            <p className="mt-2 font-mono text-lg font-semibold text-foreground">
                              {lastResult.serialNumber || "Non detecte"}
                            </p>
                          </div>
                          <Icons.qr className="h-6 w-6 text-muted-foreground" />
                        </div>
                        {lastResult.details ? (
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">{lastResult.details}</p>
                        ) : null}
                      </div>

                      {matchedEquipment ? (
                        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                              <Icons.check className="h-5 w-5" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">Correspondance trouvee</p>
                              <p className="text-lg font-semibold text-foreground">{matchedEquipment.poste}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="status-ok">
                                  {matchedEquipment.etat}
                                </Badge>
                                <Badge variant="outline">{matchedEquipment.category}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-border p-5 text-sm text-muted-foreground">
                          Aucune correspondance exacte dans l inventaire pour cette analyse.
                        </div>
                      )}

                      {scanError ? (
                        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                          {scanError}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </SectionPanel>
  );
};
