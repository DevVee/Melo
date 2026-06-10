/**
 * StrengthsForm — standalone step for Personal Strengths.
 * Strengths describe who you are as a person (character traits) and appear
 * as their own section on the resume, separate from Skills.
 */
import { useState } from 'react'
import { Plus, X, Sparkles, Loader2 } from 'lucide-react'
import { useBuilderStore } from '@/store/builder.store'
import { useMutation } from '@tanstack/react-query'
import { callGroq, GROQ_MODELS } from '@/lib/groq'
import { cn } from '@/lib/utils'

// ─── Preset strengths ────────────────────────────────────────────────────────

const STRENGTH_OPTIONS = [
  'Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Adaptability',
  'Work Ethic', 'Creativity', 'Critical Thinking', 'Attention to Detail',
  'Positive Attitude', 'Time Management', 'Reliability', 'Integrity', 'Initiative',
  'Patience', 'Empathy', 'Flexibility', 'Self-Motivation', 'Collaboration',
  'Organization', 'Multi-tasking', 'Resilience', 'Professionalism', 'Punctuality',
  'Continuous Learning', 'Honesty', 'Confidence', 'Accountability', 'Goal-Oriented',
  'Resourceful', 'Detail-Oriented', 'Dependable', 'Quick Learner', 'Customer Focus',
  'Compassion', 'Dedication', 'Analytical Thinking', 'Decision Making', 'Networking',
]

// ─── Component ────────────────────────────────────────────────────────────────

export function StrengthsForm() {
  const strengths      = useBuilderStore(s => s.strengths)
  const personal       = useBuilderStore(s => s.personal)
  const experience     = useBuilderStore(s => s.experience)
  const groqApiKey     = useBuilderStore(s => s.groqApiKey)
  const addStrength    = useBuilderStore(s => s.addStrength)
  const removeStrength = useBuilderStore(s => s.removeStrength)

  const [customInput, setCustomInput] = useState('')

  const { mutate: generateStrengths, isPending: generating } = useMutation({
    mutationFn: async () => callGroq(
      [
        {
          role: 'system',
          content: `You are a senior HR manager who has reviewed 10,000+ resumes.
List 5–7 personal character strengths suitable for a professional resume.
Rules:
- These are personal traits / soft characteristics, NOT job skills
- Short: 2–3 words each max
- Honest — only what a real person in this role would credibly claim
- Output ONLY a JSON array of short strings. No explanation.
Example: ["Leadership","Problem Solving","Attention to Detail"]`,
        },
        {
          role: 'user',
          content: `Job target: ${personal.professionalTitle || 'professional'}.
Experience: ${experience.map(e => e.position).join(', ') || 'various roles'}.
Suggest 5–7 personal strengths as JSON array.`,
        },
      ],
      120, GROQ_MODELS.FAST, groqApiKey,
    ),
    onSuccess: (text) => {
      try {
        const start = text.indexOf('[')
        const end   = text.lastIndexOf(']')
        if (start === -1 || end === -1) return
        const items: string[] = JSON.parse(text.slice(start, end + 1))
        items.forEach(str => addStrength(str.trim()))
      } catch { /* ignore parse error */ }
    },
  })

  function handleCustomAdd() {
    const trimmed = customInput.trim()
    if (!trimmed) return
    if (strengths.includes(trimmed)) return
    addStrength(trimmed)
    setCustomInput('')
  }

  const available = STRENGTH_OPTIONS.filter(s => !strengths.includes(s))

  return (
    <div className="space-y-5">

      {/* ── Chosen strengths ─────────────────────────────────────────────── */}
      {strengths.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Your Strengths ({strengths.length})
          </p>
          <ul className="space-y-0.5 pl-1">
            {strengths.map(str => (
              <li key={str} className="flex items-center gap-2 py-1 text-sm text-gray-800 group">
                <span className="text-purple-400 shrink-0">•</span>
                <span className="flex-1">{str}</span>
                <button
                  type="button"
                  onClick={() => removeStrength(str)}
                  className="text-red-400 hover:text-red-600 focus:text-red-600 transition-colors shrink-0 rounded-[3px]"
                  title={`Remove ${str}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-5 border border-dashed border-gray-200 rounded-[3px]">
          <p className="text-sm text-gray-500">No strengths chosen yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Pick from the list below, type your own, or let AI suggest for you.
          </p>
        </div>
      )}

      {/* ── AI generate ──────────────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-[3px] p-3 flex items-center gap-3 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Let AI pick for you</p>
          <p className="text-xs text-gray-500 mt-0.5">
            We'll suggest strengths that match your target job and experience.
          </p>
        </div>
        <button
          onClick={() => generateStrengths()}
          disabled={generating}
          className="shrink-0 flex items-center gap-1.5 rounded-[3px] px-3 py-2 text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: 'var(--melo-gradient)' }}
        >
          {generating
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Sparkles className="h-3.5 w-3.5" />}
          {generating ? 'Generating…' : 'Generate for me'}
        </button>
      </div>

      {/* ── Custom input ─────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Add your own
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCustomAdd())}
            placeholder="e.g. Fast Learner, Detail-Oriented…"
            className="flex-1 rounded-[3px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <button
            onClick={handleCustomAdd}
            className="rounded-[3px] px-4 py-2.5 text-white font-semibold text-sm shrink-0 transition-all hover:opacity-90"
            style={{ background: 'var(--melo-gradient)' }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Quick-pick preset list ────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Or choose from common strengths
        </p>
        <div className="flex flex-wrap gap-2">
          {available.slice(0, 24).map(str => (
            <button
              key={str}
              onClick={() => addStrength(str)}
              className={cn(
                'flex items-center gap-1 rounded-[3px] border px-2.5 py-1.5 text-xs transition-colors',
                'border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50'
              )}
            >
              <Plus className="h-3 w-3" /> {str}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
