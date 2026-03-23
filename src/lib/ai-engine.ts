import { pipeline } from "@xenova/transformers";

let detector: any = null;

export const aiEngine = {
  init: async () => {
    if (detector) return;
    try {
      // YOLOv8n is significantly faster for real-time video detection in the browser
      detector = await pipeline("object-detection", "Xenova/yolov8n");
      console.log("AI Engine initialized (YOLOv8n)");
    } catch (error) {
      console.error("Failed to initialize AI Engine:", error);
    }
  },

  detect: async (imageSource: string | HTMLImageElement) => {
    if (!detector) await aiEngine.init();
    if (!detector) return [];

    try {
      const results = await detector(imageSource, {
        threshold: 0.5,
        percentage: true,
      });
      
      // Map and filter results to relevant hardware
      return results.filter((item: any) => 
        ["computer", "laptop", "monitor", "tv", "keyboard", "mouse", "cell phone"].includes(item.label)
      );
    } catch (error) {
      console.error("Detection error:", error);
      return [];
    }
  }
};
