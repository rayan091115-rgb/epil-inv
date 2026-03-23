import { pipeline } from "@xenova/transformers";

let detectorFast: any = null;
let detectorPrecision: any = null;

export const aiEngine = {
  init: async () => {
    try {
      if (!detectorFast) {
        // YOLO26-Nano is the 2026 standard for ultra-fast, NMS-free mobile detection
        detectorFast = await pipeline("object-detection", "Xenova/yolo26n");
        console.log("Fast AI Engine initialized (YOLO26-Nano)");
      }
      
      if (!detectorPrecision) {
        // RF-DETR with DINOv2 backbone is the premium choice for hardware-specific precision
        detectorPrecision = await pipeline("object-detection", "Xenova/rf-detr-m");
        console.log("Precision AI Engine initialized (RF-DETR)");
      }
    } catch (error) {
      console.error("Failed to initialize AI Engine:", error);
    }
  },

  detect: async (imageSource: string | HTMLImageElement, usePrecision = false) => {
    // Ensure engines are initialized
    if (!detectorFast) await aiEngine.init();
    
    const engine = (usePrecision && detectorPrecision) ? detectorPrecision : detectorFast;
    if (!engine) return [];

    try {
      const results = await engine(imageSource, {
        threshold: 0.35, // Lower threshold for "Computer" detection to avoid missing towers
        percentage: true,
      });
      
      // Filter for broad hardware categories including "Computer" (Objects365)
      return results.filter((item: any) => 
        ["computer", "laptop", "monitor", "tv", "desktop computer", "central system unit"].includes(item.label.toLowerCase())
      );
    } catch (error) {
      console.error("Detection error:", error);
      return [];
    }
  }
};
