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

  /**
   * Generate 10 Topic-Based MCQs using Gemini AI (with robust Fallback)
   */
  async generateTopicMcqs(subjectName, topicName) {
    const topicStr = topicName || 'General Curriculum Concepts';
    const subStr = subjectName || 'Core Subject';

    const promptText = `You are an expert academic evaluator. Generate exactly 10 high-quality multiple-choice questions (MCQs) for university students based on:
Subject: "${subStr}"
Topic Covered: "${topicStr}"

Return ONLY a valid JSON array of 10 objects with NO markdown formatting, NO code blocks, and NO leading/trailing prose.
Required JSON Schema per element:
{
  "question_number": 1,
  "question_text": "Clear question text about ${topicStr}",
  "option_a": "Option A text",
  "option_b": "Option B text",
  "option_c": "Option C text",
  "option_d": "Option D text",
  "correct_option": "A",
  "explanation": "Concise 1-2 sentence explanation of why this option is correct."
}`;

    if (this.apiKey && this.ai) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          config: {
            temperature: 0.5,
          }
        });

        const rawText = response.text ? response.text.trim() : '';
        const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          return parsed.slice(0, 10).map((q, idx) => ({
            question_number: idx + 1,
            question_text: q.question_text || `Question ${idx + 1} regarding ${topicStr}`,
            option_a: q.option_a || 'Option A',
            option_b: q.option_b || 'Option B',
            option_c: q.option_c || 'Option C',
            option_d: q.option_d || 'Option D',
            correct_option: ['A', 'B', 'C', 'D'].includes((q.correct_option || '').toUpperCase()) ? q.correct_option.toUpperCase() : 'A',
            explanation: q.explanation || `This tests core knowledge of ${topicStr}.`
          }));
        }
      } catch (err) {
        console.error('[GEMINI MCQ GENERATION ERROR]:', err.message || err);
      }
    }

    return this.generateFallbackMcqs(subStr, topicStr);
  }

  generateFallbackMcqs(subjectName, topicName) {
    const fallbacks = [];
    for (let i = 1; i <= 10; i++) {
      const options = ['A', 'B', 'C', 'D'];
      const correctOpt = options[(i - 1) % 4];
      fallbacks.push({
        question_number: i,
        question_text: `[${subjectName}] Question ${i}: Which of the following is a primary concept of "${topicName}"?`,
        option_a: `Core principle A relating to ${topicName}`,
        option_b: `Fundamental property B of ${topicName}`,
        option_c: `Key analytical method C in ${topicName}`,
        option_d: `Standard operational mechanism D of ${topicName}`,
        correct_option: correctOpt,
        explanation: `In ${subjectName}, key property ${correctOpt} is fundamental to understanding ${topicName}.`
      });
    }
    return fallbacks;
  }
}

