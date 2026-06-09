/**
 * Groq API client — OpenAI-compatible REST.
 * Get a free key at console.groq.com and paste it into the app Settings.
 *
 * Models used:
 *   POWERFUL : llama-3.3-70b-versatile  → analysis, ATS scoring, structured JSON
 *   FAST     : llama-3.3-70b-versatile  → writing, bullets, summaries
 *   ULTRAFAST: llama-3.1-8b-instant     → autocomplete hints
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export const GROQ_MODELS = {
  POWERFUL:   'llama-3.3-70b-versatile',
  FAST:       'llama-3.3-70b-versatile',
  ULTRAFAST:  'llama-3.1-8b-instant',
} as const

type Message = { role: 'system' | 'user' | 'assistant'; content: string }

/**
 * Clean AI output:
 * 1. Strip <think>…</think> blocks (DeepSeek-style reasoning)
 * 2. Strip markdown code fences (```json ... ```)
 * 3. Strip label prefixes the model sometimes emits before the real answer
 *    e.g. "Results:", "Here is:", "Output:", "Summary:", "Response:"
 */
function stripThinking(text: string): string {
  let t = text

  // 1. Think blocks
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '')

  // 2. Markdown code fences (```json\n...\n``` or ```\n...\n```)
  t = t.replace(/^```(?:json|text|markdown)?\s*/im, '').replace(/\s*```\s*$/im, '')

  // 3. Common label prefixes the model prepends before actual content
  //    Handles: "Results:", "Result:", "Here is:", "Here are:", "Output:",
  //             "Response:", "Summary:", "Answer:", "Generated:"
  t = t.replace(/^\s*(results?|here\s+(?:is|are)|output|response|summary|answer|generated)\s*:\s*/i, '')

  return t.trim()
}

/**
 * Call the Groq API.
 * Priority for API key: 1. apiKey param  2. VITE_GROQ_API_KEY env var
 */
export async function callGroq(
  messages: Message[],
  maxTokens = 800,
  model: string = GROQ_MODELS.FAST,
  apiKey?: string,
): Promise<string> {
  const key = apiKey?.trim() || (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim()

  if (!key) {
    throw new Error(
      'No Groq API key. Open Settings (top-right) and paste your key — free at console.groq.com'
    )
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    // Friendly error messages
    if (res.status === 401) throw new Error('Invalid Groq API key. Check Settings and try again.')
    if (res.status === 429) throw new Error('Groq rate limit hit. Wait a moment and try again.')
    throw new Error(`Groq error ${res.status}: ${err}`)
  }

  const json = await res.json() as { choices: { message: { content: string } }[] }
  const raw = json.choices[0]?.message?.content ?? ''

  // Always strip DeepSeek's <think> blocks — harmless for other models
  return stripThinking(raw)
}
