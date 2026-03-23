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
                text: "Analyze this image of a computer or IT equipment. Identify the Brand, Model Name, and if visible, the Serial Number or Asset Tag. Return ONLY a JSON object with these keys: brand, model, serialNumber, details. If something is not visible, use null.",
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
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Réponse vide de l'IA");
      
      return JSON.parse(content);
    } catch (error) {
      console.error("Error in Groq identification:", error);
      throw error;
    }
  },
};
