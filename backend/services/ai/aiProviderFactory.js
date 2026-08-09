import { GeminiAdapter } from './geminiAdapter.js';

class AIProviderFactory {
    static getProvider() {
        const providerName = process.env.AI_PROVIDER || 'gemini';
        
        switch (providerName.toLowerCase()) {
            case 'gemini':
                return new GeminiAdapter();
            case 'openai':
                throw new Error('OpenAI adapter not implemented yet');
            case 'claude':
                throw new Error('Claude adapter not implemented yet');
            default:
                return new GeminiAdapter();
        }
    }
}

export default AIProviderFactory;
