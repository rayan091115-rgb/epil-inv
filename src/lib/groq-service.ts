import { Groq } from "groq-sdk";

const getGroqClient = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.error("VITE_GROQ_API_KEY is missing in .env");
    return null;
  }
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

export const groqService = {
  identifyEquipment: async (base64Image: string) => {
    const groq = getGroqClient();
    if (!groq) throw new Error("API Groq non configurée");

    try {
      const response = await groq.chat.completions.create({
        model: "moonshotai/kimi-k2-instruct-0905",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert Computer Hardware Inventory Agent. Analyze this IT equipment image.
                - BRAND: Dell, HP, Lenovo, etc.
                - MODEL: Exact model name (e.g. OptiPlex 7040).
                - SERIAL: Look for 'S/N', 'Service Tag', or 'Serial Number'.
                - DETAILS: Note visible ports, size (SFF, Tower), or asset tags.
                
                RETURN ONLY A JSON OBJECT matching this schema:
                { "brand": "string|null", "model": "string|null", "serialNumber": "string|null", "details": "string|null" }
                NO markdown, NO backticks, NO extra text.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content?.trim() || "{}";
      
      // Robust JSON extraction using regex to find the first '{' and last '}'
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Aucune donnée structurée trouvée");
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error in Groq identification:", error);
      throw error;
    }
  },
};
