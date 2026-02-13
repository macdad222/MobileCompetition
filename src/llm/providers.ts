export type LLMProviderType = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OPENAI_COMPATIBLE';

export interface LLMProviderConfig {
  type: LLMProviderType;
  name: string;
  description: string;
  models: { id: string; name: string; description?: string }[];
  baseUrl?: string;
  requiresBaseUrl: boolean;
}

export const LLM_PROVIDERS: LLMProviderConfig[] = [
  {
    type: 'OPENAI',
    name: 'OpenAI',
    description: 'GPT-5, GPT-4o, o1, o3, and other OpenAI models',
    requiresBaseUrl: false,
    models: [
      // GPT-5 series
      { id: 'gpt-5.2', name: 'GPT-5.2', description: 'Latest GPT-5 series model' },
      // Latest reasoning models
      { id: 'o3-mini', name: 'o3-mini', description: 'Latest reasoning model, cost-effective' },
      { id: 'o1', name: 'o1', description: 'Advanced reasoning model' },
      { id: 'o1-mini', name: 'o1-mini', description: 'Smaller reasoning model' },
      { id: 'o1-preview', name: 'o1-preview', description: 'Preview reasoning model' },
      // GPT-4o series
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable multimodal model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable multimodal' },
      { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest', description: 'Latest ChatGPT model' },
      // GPT-4 Turbo
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'GPT-4 Turbo with vision' },
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', description: 'GPT-4 Turbo preview' },
      // Legacy
      { id: 'gpt-4', name: 'GPT-4', description: 'Standard GPT-4 model' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    ],
  },
  {
    type: 'ANTHROPIC',
    name: 'Anthropic',
    description: 'Claude 4, Claude 3.5, and Claude 3 family of models',
    requiresBaseUrl: false,
    models: [
      // Claude 4 series (latest)
      { id: 'claude-4-opus-20250201', name: 'Claude 4.6 Opus', description: 'Latest and most powerful Claude' },
      { id: 'claude-4-opus-20241201', name: 'Claude 4.5 Opus', description: 'Advanced Claude 4 Opus' },
      // Claude 3.5 series
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Latest and most capable Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast and affordable Claude 3.5' },
      // Claude 3 series
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful Claude 3' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced Claude 3' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast Claude 3' },
    ],
  },
  {
    type: 'GEMINI',
    name: 'Google Gemini',
    description: 'Google Gemini 2.0 and 1.5 models',
    requiresBaseUrl: false,
    models: [
      // Gemini 2.0 series
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest fast Gemini model' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight 2.0 model' },
      // Gemini 1.5 series  
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Best for complex tasks' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and versatile' },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B', description: 'High volume, lower cost' },
    ],
  },
  {
    type: 'OPENAI_COMPATIBLE',
    name: 'OpenAI-Compatible',
    description: 'Any OpenAI-compatible API (Ollama, Together, Groq, etc.)',
    requiresBaseUrl: true,
    models: [
      { id: 'custom', name: 'Custom Model', description: 'Specify your model name' },
    ],
  },
];

export function getProviderConfig(type: LLMProviderType): LLMProviderConfig | undefined {
  return LLM_PROVIDERS.find((p) => p.type === type);
}

export function getModelsForProvider(type: LLMProviderType): LLMProviderConfig['models'] {
  const provider = getProviderConfig(type);
  return provider?.models || [];
}
