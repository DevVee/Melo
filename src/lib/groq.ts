/**
 * Groq API client — OpenAI-compatible REST.
 *
 * Key resolution order:
 *   1. apiKey argument (user's own key from Settings)
 *   2. VITE_GROQ_API_KEY env var (set in .env.local during dev)
 *   3. /api/groq  — Vercel Edge proxy using the server-side GROQ_API_KEY
 *      → this is the default path in production; key is NEVER in the bundle
 *
 * Models:
 *   POWERFUL / FAST : llama-3.3-70b-versatile
 *   ULTRAFAST       : llama-3.1-8b-instant
 */

const GROQ_DIRECT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_PROXY  = '/api/groq'   // Vercel Edge function

export const GROQ_MODELS = {
  POWERFUL:  'llama-3.3-70b-versatile',
  FAST:      'llama-3.3-70b-versatile',
  ULTRAFAST: 'llama-3.1-8b-instant',
} as const

type Message = { role: 'system' | 'user' | 'assistant'; content: string }

/**
 * Strip AI meta-noise from the output:
 * - <think>…</think> blocks (DeepSeek reasoning)
 * - Markdown code fences
 * - "Results:", "Here is:", "Output:", … prefixes
 */
function clean(text: string): string {
  let t = text
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '')
  t = t.replace(/^```(?:json|text|markdown)?\s*/im, '').replace(/\s*```\s*$/im, '')
  t = t.replace(/^\s*(results?|here\s+(?:is|are)|output|response|summary|answer|generated)\s*:\s*/i, '')
  return t.trim()
}

type GroqBody = {
  model: string
  messages: Message[]
  max_tokens: number
  temperature: number
}

async function doFetch(url: string, body: GroqBody, bearerKey?: string): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (bearerKey) headers['Authorization'] = `Bearer ${bearerKey}`
  return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
}

/**
 * Call the Groq API (direct or via server proxy).
 */
export async function callGroq(
  messages: Message[],
  maxTokens = 800,
  model: string = GROQ_MODELS.FAST,
  apiKey?: string,
): Promise<string> {
  const clientKey = apiKey?.trim() || (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim()

  const body: GroqBody = { model, messages, max_tokens: maxTokens, temperature: 0.7 }

  let res: Response

  if (clientKey) {
    // User has their own key — call Groq directly (higher rate limits)
    res = await doFetch(GROQ_DIRECT, body, clientKey)
  } else {
    // Use server-side proxy (owner's key, works for all users)
    res = await doFetch(GROQ_PROXY, body).catch(() => {
      // Proxy unreachable (e.g. local dev without Vercel CLI)
      throw new Error('AI server unreachable. Open ⚙ Settings → paste your free Groq key from console.groq.com')
    })

    if (res.status === 503) {
      // Proxy running but key not set in Vercel env vars
      throw new Error('AI key not set on server. Ask the admin to add GROQ_API_KEY in Vercel, or open ⚙ Settings and paste your own free key from console.groq.com')
    }
  }

  if (!res.ok) {
    const err = await res.text()
    if (res.status === 401) throw new Error('Invalid API key — check Settings.')
    if (res.status === 429) throw new Error('Rate limit hit. Wait a moment and try again.')
    throw new Error(`AI error ${res.status}: ${err}`)
  }

  const json = await res.json() as { choices: { message: { content: string } }[] }
  return clean(json.choices[0]?.message?.content ?? '')
}
