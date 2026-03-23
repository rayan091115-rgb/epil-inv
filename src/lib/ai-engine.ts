import { pipeline } from "@xenova/transformers";

let detectorFast: any = null;
let detectorPrecision: any = null;

export const aiEngine = {
  init: async () => {
    try {
      if (!detectorFast) {
        // Standard YOLOv8n is widely supported and fast
        detectorFast = await pipeline("object-detection", "Xenova/yolov8n");
        console.log("Fast AI Engine initialized (YOLOv8n)");
      }
      
      if (!detectorPrecision) {
        // DETR-ResNet-50 is the gold standard for accurate object detection in Transformers.js
        detectorPrecision = await pipeline("object-detection", "Xenova/detr-resnet-50");
        console.log("Precision AI Engine initialized (DETR)");
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
      
      // Filter for broad hardware categories including "Computer"
      // Note: PC Towers are often misclassified as "refrigerator" or "microwave" by COCO models!
      const hardwareLabels = [
        "computer", "laptop", "monitor", "tv", "desktop computer", 
        "central system unit", "refrigerator", "microwave", "appliance"
      ];

      return results.filter((item: any) => 
        hardwareLabels.includes(item.label.toLowerCase())
      );
    } catch (error) {
      console.error("Detection error:", error);
      return [];
    }
  }
};
