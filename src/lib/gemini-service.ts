import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is missing in .env");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export const geminiService = {
  identifyEquipment: async (base64Image: string) => {
    const genAI = getGeminiClient();
    if (!genAI) throw new Error("Gemini API non configurée");

    // The model ID provided by the user
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    // Clean base64 string (remove data:image/jpeg;base64, if present)
    const base64Data = base64Image.split(",")[1] || base64Image;

    const prompt = `You are a High-Precision IT Asset Discovery Agent.
Analyze the image of this hardware (PC Tower, Laptop, Monitor, or Server).
TASK: Identify the manufacturer, exact model line, and serial number/service tag.

CRITICAL INSTRUCTIONS:
1. FOCUS on small stickers, QR codes, or engraved logos.
2. For PC Towers: Identify the sub-model (SFF, Tower, Micro).
3. SEARCH for the Serial Number (S/N) or Service Tag.
4. Look for asset tags or school/company stickers.

RETURN ONLY A JSON OBJECT:
{
  "brand": "string|null",
  "model": "string|null",
  "serialNumber": "string|null",
  "details": "string|null"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Robust extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Format JSON non trouvé dans la réponse Gemini");
    
    return JSON.parse(jsonMatch[0]);
  },
};
