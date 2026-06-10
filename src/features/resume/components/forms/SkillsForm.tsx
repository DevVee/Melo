import { useState } from 'react'
import { Plus, X, Sparkles, Loader2 } from 'lucide-react'
import { useBuilderStore } from '@/store/builder.store'
import { useSuggestSkills } from '@/features/resume/hooks/useAI'
import { useMutation } from '@tanstack/react-query'
import { callGroq, GROQ_MODELS } from '@/lib/groq'
import type { SkillEntry } from '@/store/builder.store'
import { cn } from '@/lib/utils'

// ─── Quick-add common skills ──────────────────────────────────────────────────

const QUICK_SKILLS = [
  'Microsoft Office', 'Microsoft Word', 'Microsoft Excel', 'Google Docs',
  'Communication', 'Teamwork', 'Leadership', 'Customer Service',
  'Time Management', 'Problem Solving', 'English', 'Filipino',
  'Driving', 'Cooking', 'Cashiering', 'Inventory',
]

// ─── Category labels (plain English) ─────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  technical: 'Technical Skills',
  soft:      'Soft Skills',
  language:  'Languages',
  framework: 'Software & Apps',
  platform:  'Systems & Platforms',
  tool:      'Tools & Equipment',
}

const CAT_DOT: Record<string, string> = {
  technical: 'bg-indigo-400',
  soft:      'bg-emerald-400',
  language:  'bg-rose-400',
  framework: 'bg-violet-400',
  platform:  'bg-cyan-400',
  tool:      'bg-orange-400',
}

function guessCategory(name: string): SkillEntry['category'] {
  const lower = name.toLowerCase()
  if (/english|filipino|tagalog|spanish|french|mandarin|japanese|arabic|korean|bisaya|cebuano|ilocano/i.test(name)) return 'language'
  if (/react|vue|angular|django|laravel|express|next|nuxt|spring|flutter|swift/i.test(name)) return 'framework'
  if (/aws|azure|gcp|cloud|docker|kubernetes|linux|windows server|unix/i.test(name)) return 'platform'
  if (/git|figma|jira|postman|notion|slack|vs code|xcode|photoshop|canva|excel|word|powerpoint|quickbooks/i.test(name)) return 'tool'
  if (/communication|teamwork|leadership|problem|time management|customer service|adaptability|attention|creative|listening|multitasking|organization/i.test(lower)) return 'soft'
  return 'technical'
}

const CATS = ['technical', 'framework', 'platform', 'tool', 'soft', 'language'] as const

// ─── Personal Strengths presets ───────────────────────────────────────────────

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

// ─── SkillsForm ───────────────────────────────────────────────────────────────

export function SkillsForm() {
  const skills       = useBuilderStore(s => s.skills)
  const personal     = useBuilderStore(s => s.personal)
  const experience   = useBuilderStore(s => s.experience)
  const strengths    = useBuilderStore(s => s.strengths)
  const groqApiKey   = useBuilderStore(s => s.groqApiKey)
  const addSkill     = useBuilderStore(s => s.addSkill)
  const removeSkill  = useBuilderStore(s => s.removeSkill)
  const addStrength  = useBuilderStore(s => s.addStrength)
  const removeStrength = useBuilderStore(s => s.removeStrength)

  const [newName, setNewName]         = useState('')
  const [suggestions, setSuggestions] = useState<SkillEntry[]>([])
  const [showSugg, setShowSugg]       = useState(false)

  const { mutate: suggest, isPending, error } = useSuggestSkills()

  const { mutate: generateStrengths, isPending: genStrengths } = useMutation({
    mutationFn: async () => callGroq(
      [
        {
          role: 'system',
          content: 'You are a career coach. List 5–8 personal strengths suitable for a professional resume. Output ONLY a JSON array of short strings (2-3 words each). Example: ["Leadership","Problem Solving","Attention to Detail"]',
        },
        {
          role: 'user',
          content: `Job target: ${personal.professionalTitle || 'professional'}. Experience: ${experience.map(e => e.position).join(', ') || 'various roles'}. Suggest personal strengths.`,
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

  function handleAdd(name = newName) {
    const trimmed = name.trim()
    if (!trimmed) return
    if (skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return
    addSkill({ name: trimmed, category: guessCategory(trimmed), level: 'intermediate' })
    setNewName('')
  }

  function handleSuggest() {
    suggest({ personal, experience }, {
      onSuccess: (suggested) => {
        const names = new Set(skills.map(s => s.name.toLowerCase()))
        setSuggestions(suggested.filter(s => !names.has(s.name.toLowerCase())))
        setShowSugg(true)
      },
    })
  }

  function addFromSuggestion(skill: SkillEntry) {
    if (!skills.some(s => s.name.toLowerCase() === skill.name.toLowerCase())) addSkill(skill)
    setSuggestions(prev => prev.filter(s => s.id !== skill.id))
    if (suggestions.length <= 1) setShowSugg(false)
  }

  const quickFiltered = QUICK_SKILLS.filter(
    n => !skills.some(s => s.name.toLowerCase() === n.toLowerCase())
  ).slice(0, 8)

  const byCategory = CATS.reduce<Record<string, SkillEntry[]>>((acc, cat) => {
    const items = skills.filter(s => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  const availableStrengths = STRENGTH_OPTIONS.filter(s => !strengths.includes(s))

  return (
    <div className="space-y-6">

      {/* ── ① Add a Skill ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800">Add a Skill</p>
        <p className="text-xs text-gray-500">
          Type any skill you know — e.g. <em>Customer Service</em>, <em>Microsoft Excel</em>, <em>Driving</em>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder="Type a skill and press Enter or tap +"
            className="flex-1 rounded-[2px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <button
            onClick={() => handleAdd()}
            className="rounded-[2px] px-4 py-2.5 text-white font-semibold text-sm shrink-0 transition-all hover:opacity-90"
            style={{ background: 'var(--melo-gradient)' }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── ② Quick add ───────────────────────────────────────────────────── */}
      {quickFiltered.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Common Skills — Tap to Add</p>
          <div className="flex flex-wrap gap-2">
            {quickFiltered.map(name => (
              <button
                key={name}
                onClick={() => addSkill({ name, category: guessCategory(name), level: 'intermediate' })}
                className="flex items-center gap-1 rounded-[2px] border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <Plus className="h-3 w-3" /> {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ③ AI suggestions ──────────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-[2px] p-3 flex items-center gap-3 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Not sure what to add?</p>
          <p className="text-xs text-gray-500 mt-0.5">We can suggest skills based on your experience and target job.</p>
        </div>
        <button
          onClick={handleSuggest}
          disabled={isPending}
          className="shrink-0 flex items-center gap-1.5 rounded-[2px] px-3 py-2 text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: 'var(--melo-gradient)' }}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isPending ? 'Loading…' : 'Suggest Skills'}
        </button>
      </div>

      {/* Suggestion chips */}
      {showSugg && suggestions.length > 0 && (
        <div className="border border-purple-200 rounded-[2px] bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Tap any to add</p>
            <button onClick={() => setShowSugg(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(skill => (
              <button
                key={skill.id}
                onClick={() => addFromSuggestion(skill)}
                className="flex items-center gap-1.5 rounded-[2px] border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm text-purple-800 font-medium hover:bg-purple-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> {skill.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[2px] px-3 py-2">
          {(error as Error).message}
        </p>
      )}

      {/* ── ④ Your Skills (bullet list) ───────────────────────────────────── */}
      {skills.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-800">Your Skills ({skills.length})</p>
          {CATS.filter(cat => byCategory[cat]).map(cat => (
            <div key={cat} className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full shrink-0', CAT_DOT[cat] ?? 'bg-gray-400')} />
                {CAT_LABELS[cat]}
              </p>
              <ul className="space-y-0.5 pl-3">
                {byCategory[cat].map(skill => (
                  <li
                    key={skill.id}
                    className="flex items-center gap-2 py-1 text-sm text-gray-800 group"
                  >
                    <span className="text-gray-400 shrink-0">•</span>
                    <span className="flex-1">{skill.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      title={`Remove ${skill.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-[2px]">
          <p className="text-sm text-gray-500">No skills added yet.</p>
          <p className="text-xs text-gray-400 mt-1">Type a skill above or tap from the common skills list.</p>
        </div>
      )}

      {/* ── ⑤ Personal Strengths ──────────────────────────────────────────── */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">Personal Strengths</p>
            <p className="text-xs text-gray-500 mt-0.5">
              These describe <em>who you are</em> as a person — great for fresh grads or career changers.
              <span className="ml-1 text-gray-400">optional</span>
            </p>
          </div>
          <button
            onClick={() => generateStrengths()}
            disabled={genStrengths}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-[2px] px-2.5 py-1.5 hover:bg-purple-100 disabled:opacity-50 transition-colors"
          >
            {genStrengths ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {genStrengths ? 'Generating…' : 'Generate for me'}
          </button>
        </div>

        {/* Chosen strengths — bullet list */}
        {strengths.length > 0 && (
          <ul className="space-y-0.5 pl-2 mb-2">
            {strengths.map(str => (
              <li key={str} className="flex items-center gap-2 py-1 text-sm text-gray-800 group">
                <span className="text-purple-400 shrink-0">•</span>
                <span className="flex-1">{str}</span>
                <button
                  type="button"
                  onClick={() => removeStrength(str)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                  title={`Remove ${str}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Preset chips to choose from */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Choose from list</p>
          <div className="flex flex-wrap gap-2">
            {availableStrengths.slice(0, 20).map(str => (
              <button
                key={str}
                onClick={() => addStrength(str)}
                className="flex items-center gap-1 rounded-[2px] border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <Plus className="h-3 w-3" /> {str}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
