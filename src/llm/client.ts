import { LLMProviderType } from './providers';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMClientConfig {
  providerType: LLMProviderType;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export async function testLLMConnection(config: LLMClientConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await callLLM(config, [
      { role: 'user', content: 'Reply with just the word "connected" to confirm you are working.' },
    ]);
    
    if (response.content.toLowerCase().includes('connected')) {
      return { success: true };
    }
    
    return { success: true }; // Even if response is different, if we got here it's working
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function callLLM(config: LLMClientConfig, messages: LLMMessage[], maxTokens?: number): Promise<LLMResponse> {
  switch (config.providerType) {
    case 'OPENAI':
    case 'OPENAI_COMPATIBLE':
      return callOpenAI(config, messages, maxTokens);
    case 'ANTHROPIC':
      return callAnthropic(config, messages, maxTokens);
    case 'GEMINI':
      return callGemini(config, messages, maxTokens);
    default:
      throw new Error(`Unsupported provider: ${config.providerType}`);
  }
}

async function callOpenAI(config: LLMClientConfig, messages: LLMMessage[], maxTokens?: number): Promise<LLMResponse> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const limit = maxTokens || 4096;
  
  // Newer OpenAI models (gpt-4o, o1, o3, gpt-5.x) use max_completion_tokens instead of max_tokens
  const isNewerModel = config.model.startsWith('gpt-4o') || 
                       config.model.startsWith('gpt-5') ||
                       config.model.startsWith('o1') || 
                       config.model.startsWith('o3') ||
                       config.model.startsWith('chatgpt-4o');
  
  const tokenParam = isNewerModel 
    ? { max_completion_tokens: limit } 
    : { max_tokens: limit };
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      ...tokenParam,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

async function callAnthropic(config: LLMClientConfig, messages: LLMMessage[], maxTokens?: number): Promise<LLMResponse> {
  // Extract system message if present
  const systemMessage = messages.find((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');
  const limit = maxTokens || 4096;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: limit,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    content: data.content[0]?.text || '',
    usage: data.usage
      ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        }
      : undefined,
  };
}

async function callGemini(config: LLMClientConfig, messages: LLMMessage[], maxTokens?: number): Promise<LLMResponse> {
  const limit = maxTokens || 4096;
  
  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Add system instruction if present
  const systemMessage = messages.find((m) => m.role === 'system');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          maxOutputTokens: limit,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0,
        }
      : undefined,
  };
}
