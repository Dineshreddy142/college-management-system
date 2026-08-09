import { GoogleGenAI } from '@google/genai';

export class GeminiAdapter {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY is missing. AI features will fail.");
        }
        // Initialize the Gemini client
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    }

    async generateChatResponse(systemInstruction, history, userMessage) {
        try {
            // Convert history format to Gemini format
            const contents = history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.message }]
            }));

            // Add the new user message
            contents.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });

            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                }
            });

            return response.text;
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new Error("Failed to generate AI response.");
        }
    }
}
