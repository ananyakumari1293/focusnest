import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing Gemini API Key");
}

const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `You are FocusNest AI, a cozy, supportive, and warm AI study companion.
Your tone is friendly, encouraging, and soothing (using study companion emojis like 🌸, ☕, 🌿, 📚, ✨).
You help users plan their studies, stay productive, explain concepts simply, and break down goals.
Keep responses practical, structured, and relatively brief so they fit well in a chat balloon.
Always format your responses in clean markdown.`;

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function askGemini(prompt: string, history: ChatMessage[] = []): Promise<string> {
  const modelName = "gemini-1.5-flash";
  console.log("Gemini SDK Version: ^0.24.1");
  console.log("Gemini API Key Exists:", !!apiKey);
  console.log("Model:", modelName);

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const sanitizedHistory = [...history];

    while (
      sanitizedHistory.length > 0 &&
      sanitizedHistory[0].role === "model"
    ) {
      sanitizedHistory.shift();
    }

    // Ensure strict alternating roles
    const strictHistory: ChatMessage[] = [];
    for (const msg of sanitizedHistory) {
      if (strictHistory.length === 0 || strictHistory[strictHistory.length - 1].role !== msg.role) {
        strictHistory.push({ ...msg });
      } else {
        strictHistory[strictHistory.length - 1].text += "\n" + msg.text;
      }
    }

    const chat = model.startChat({
      history: strictHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("FULL GEMINI ERROR:", error);
    return "🌸 Sorry, the AI assistant is taking a short break right now.";
  }
}