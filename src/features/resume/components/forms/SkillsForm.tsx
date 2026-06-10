import { useState } from 'react'
import { Plus, X, Sparkles, Loader2 } from 'lucide-react'
import { useBuilderStore } from '@/store/builder.store'
import { useSuggestSkills } from '@/features/resume/hooks/useAI'
import type { SkillEntry } from '@/store/builder.store'
import { cn } from '@/lib/utils'

// Quick-add common skills — plain, everyday terms
const QUICK_SKILLS = [
  'Microsoft Office', 'Microsoft Word', 'Microsoft Excel', 'Google Docs',
  'Communication', 'Teamwork', 'Leadership', 'Customer Service',
  'Time Management', 'Problem Solving', 'English', 'Filipino',
  'Driving', 'Cooking', 'Cashiering', 'Inventory',
]

// Plain English category names for non-technical users
const CAT_LABELS: Record<string, string> = {
  technical: 'Technical Skills',
  soft:      'Soft Skills',
  language:  'Languages',
  framework: 'Software & Apps',
  platform:  'Systems & Platforms',
  tool:      'Tools & Equipment',
}

const CAT_PILL: Record<string, string> = {
  technical: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  soft:      'bg-emerald-100 text-emerald-800 border-emerald-300',
  language:  'bg-rose-100 text-rose-800 border-rose-300',
  framework: 'bg-violet-100 text-violet-800 border-violet-300',
  platform:  'bg-cyan-100 text-cyan-800 border-cyan-300',
  tool:      'bg-orange-100 text-orange-800 border-orange-300',
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

export function SkillsForm() {
  const skills      = useBuilderStore(s => s.skills)
  const personal    = useBuilderStore(s => s.personal)
  const experience  = useBuilderStore(s => s.experience)
  const addSkill    = useBuilderStore(s => s.addSkill)
  const removeSkill = useBuilderStore(s => s.removeSkill)

  const [newName, setNewName]         = useState('')
  const [suggestions, setSuggestions] = useState<SkillEntry[]>([])
  const [showSugg, setShowSugg]       = useState(false)

  const { mutate: suggest, isPending, error } = useSuggestSkills()

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

  return (
    <div className="space-y-5">

      {/* ── Type a skill ── */}
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

      {/* ── Quick add ── */}
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

      {/* ── Get suggestions from AI ── */}
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

      {/* Suggestion results */}
      {showSugg && suggestions.length > 0 && (
        <div className="border border-purple-200 rounded-[2px] bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Suggested Skills — tap any to add</p>
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

      {/* ── Your skills ── */}
      {skills.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-800">Your Skills ({skills.length})</p>
          {CATS.filter(cat => byCategory[cat]).map(cat => (
            <div key={cat} className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {CAT_LABELS[cat]}
              </p>
              <div className="flex flex-wrap gap-2">
                {byCategory[cat].map(skill => (
                  <div
                    key={skill.id}
                    className={cn(
                      'flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 text-sm font-medium',
                      CAT_PILL[skill.category] ?? CAT_PILL.technical
                    )}
                  >
                    <span>{skill.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      title={`Remove ${skill.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-[2px]">
          <p className="text-sm text-gray-500">No skills added yet.</p>
          <p className="text-xs text-gray-400 mt-1">Type a skill above or tap from the common skills list.</p>
        </div>
      )}

    </div>
  )
}
