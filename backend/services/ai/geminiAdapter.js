import { GoogleGenAI } from '@google/genai';

export class GeminiAdapter {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('[GEMINI ADAPTER WARNING] GEMINI_API_KEY is not set in environment variables.');
    } else {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async generateChatResponse(systemInstruction, history = [], userMessage) {
    if (!this.apiKey || !this.ai) {
      return this.generateFallbackResponse(userMessage, systemInstruction);
    }

    try {
      // Format history for Gemini SDK
      const contents = history.map(msg => ({
        role: (msg.role === 'user' || msg.sender === 'user') ? 'user' : 'model',
        parts: [{ text: msg.message || msg.content || '' }]
      })).filter(c => c.parts[0].text.trim().length > 0);

      // Append current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.6,
        }
      });

      return response.text;
    } catch (error) {
      console.error('[GEMINI API ERROR]:', error.message || error);
      return this.generateFallbackResponse(userMessage, systemInstruction);
    }
  }

  /**
   * Smart rule-based fallback when API key is missing or quota exceeded
   */
  generateFallbackResponse(userMessage, systemInstruction) {
    const q = (userMessage || '').toLowerCase();
    
    if (q.includes('attendance')) {
      return "📊 **Attendance Query**\n\nYour attendance records are updated daily by subject faculty. You can view your detailed subject-wise breakdown in the **Attendance Module** from your portal dashboard.";
    }
    if (q.includes('schedule') || q.includes('timetable') || q.includes('class')) {
      return "📅 **Timetable & Schedule**\n\nYour daily class schedule and room allocations are accessible under the **Timetable** section in your portal sidebar.";
    }
    if (q.includes('fee') || q.includes('payment') || q.includes('dues')) {
      return "💳 **Fee Status**\n\nYou can review pending tuition fees, payment history, and generate receipts under the **Fees Portal**.\n\n```json\n{ \"action\": \"OPEN_FEE_PAYMENT\" }\n```";
    }
    if (q.includes('room') || q.includes('where') || q.includes('navigate') || q.includes('lab') || q.includes('library')) {
      return "🗺️ **Campus Navigation**\n\nYou can locate rooms, laboratories, and faculty cabins using the interactive **Campus Map** tab.\n\n```json\n{ \"action\": \"NAVIGATE\", \"destinationNodeId\": \"1\" }\n```";
    }

    return `Hello! I am your **Campus AI Assistant**. I can help you with:\n- 📊 Attendance tracking & subject percentages\n- 📅 Today's class timetable & room locations\n- 💳 Fee balances & online payment options\n- 🗺️ Campus navigation & room directions\n\nHow can I assist you today?`;
  }
}
