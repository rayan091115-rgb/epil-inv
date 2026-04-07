import { pipeline, env } from "@xenova/transformers";

// CRITICAL FIX: Prevent Transformers.js from failing on Vite's index.html fallback
// This forces downloading the models directly from HuggingFace Hub
env.allowLocalModels = false;
env.useBrowserCache = false;

// CRITICAL FIX 2: Point WASM paths to a public CDN so Vite doesn't intercept the .wasm file requests
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';

let detectorFast: any = null;
let detectorPrecision: any = null;

export const aiEngine = {
  init: async () => {
    try {
      if (!detectorFast) {
        // Fallback to detr-resnet-50 for both fast and precision because yolov8n throws 401 on Hugging Face now
        detectorFast = await pipeline("object-detection", "Xenova/detr-resnet-50");
        console.log("Fast AI Engine initialized (DETR)");
      }
      
      if (!detectorPrecision) {
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
        threshold: 0.15, // Extremely low threshold to catch dark towers
        percentage: true,
      });
      
      // Filter for broad hardware categories including common misclassifications
      const hardwareLabels = [
        "computer", "laptop", "monitor", "tv", "desktop computer", 
        "central system unit", "refrigerator", "microwave", "appliance",
        "suitcase", "box", "bed", "couch", "trash can"
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
