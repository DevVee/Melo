/**
 * Vercel Edge Function — Groq API proxy
 *
 * Keeps the Groq API key SERVER-SIDE so it is never exposed in the browser
 * bundle. All users get free AI without needing their own key.
 *
 * Deploy step: In Vercel dashboard → Settings → Environment Variables
 *   Name:  GROQ_API_KEY          (no VITE_ prefix — server-only)
 *   Value: gsk_xxxxxxxxxxxxxxxx
 *   Environment: Production + Preview + Development
 */

export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  // Only allow POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // CORS preflight (shouldn't be needed on same origin, but safe to handle)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Accept either name — GROQ_API_KEY (server-only, secure) or VITE_GROQ_API_KEY
  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  if (!key) {
    return Response.json(
      { error: 'Groq API key not configured on server.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json() as Record<string, unknown>

    const upstream = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      }
    )

    const data = await upstream.json()
    return Response.json(data, { status: upstream.status })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
