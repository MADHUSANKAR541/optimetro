import { AI_CONFIG } from './apiConfig';

export async function generateChatCompletion(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> {
  const provider = AI_CONFIG.provider;
  const model = AI_CONFIG.model;

  if (provider === 'groq') {
    const apiKey = AI_CONFIG.groqApiKey;
    if (!apiKey) throw new Error('GROQ_API_KEY missing');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 300 })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  if (provider === 'openrouter') {
    const apiKey = AI_CONFIG.openRouterApiKey;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY missing');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://your-app.example',
        'X-Title': 'Metro Assistant'
      },
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 300 })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  // Fallback: no provider
  return 'AI provider not configured.';
}


