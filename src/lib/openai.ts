/**
 * Thin wrapper around the OpenAI REST API.
 * All AI calls are client-side (user supplies their own key or uses a backend proxy).
 * For production, route these through a Supabase Edge Function to hide the key.
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

export type OpenAIMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function callOpenAI(messages: OpenAIMessage[], maxTokens = 500): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env.local')

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.7 }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `OpenAI error ${res.status}`)
  }

  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content?.trim() ?? ''
}
