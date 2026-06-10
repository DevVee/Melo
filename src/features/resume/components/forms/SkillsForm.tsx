import { useState } from 'react'
import { Plus, X, Sparkles, Loader2 } from 'lucide-react'
import { useBuilderStore } from '@/store/builder.store'
import { useSuggestSkills } from '@/features/resume/hooks/useAI'
import type { SkillEntry } from '@/store/builder.store'
import { cn } from '@/lib/utils'

// ─── Quick-add common skills ──────────────────────────────────────────────────

const QUICK_SKILLS = [
  'Microsoft Office', 'Microsoft Word', 'Microsoft Excel', 'Google Docs',
  'Communication', 'Teamwork', 'Leadership', 'Customer Service',
  'Time Management', 'Problem Solving', 'English', 'Filipino',
  'Driving', 'Cooking', 'Cashiering', 'Inventory',
]

// ─── Dynamic category color — hash-based for any category string ─────────────

const CAT_PALETTE = [
  'bg-indigo-400', 'bg-emerald-400', 'bg-violet-400', 'bg-cyan-400',
  'bg-orange-400', 'bg-rose-400',   'bg-teal-400',   'bg-amber-400',
  'bg-sky-400',    'bg-fuchsia-400', 'bg-lime-400',   'bg-pink-400',
]

const CAT_PINNED: Record<string, string> = {
  'Frontend Development': 'bg-indigo-400',
  'Backend Development':  'bg-emerald-400',
  'Database':             'bg-cyan-400',
  'Cloud & DevOps':       'bg-sky-400',
  'DevOps & Tools':       'bg-sky-400',
  'Dev Tools':            'bg-violet-400',
  'Mobile Development':   'bg-violet-400',
  'UI/UX Design':         'bg-pink-400',
  'Productivity Tools':   'bg-amber-400',
  'Soft Skills':          'bg-teal-400',
  'Languages':            'bg-rose-400',
  'Technical Skills':     'bg-indigo-400',
  // legacy short-key fallbacks
  technical: 'bg-indigo-400',
  soft:      'bg-teal-400',
  language:  'bg-rose-400',
  framework: 'bg-violet-400',
  platform:  'bg-sky-400',
  tool:      'bg-orange-400',
}

function getCatDot(cat: string): string {
  if (CAT_PINNED[cat]) return CAT_PINNED[cat]
  let h = 0
  for (let i = 0; i < cat.length; i++) h = cat.charCodeAt(i) + ((h << 5) - h)
  return CAT_PALETTE[Math.abs(h) % CAT_PALETTE.length]
}

/** Guesses a descriptive skill category from the skill name */
function guessCategory(name: string): string {
  const n = name.toLowerCase()

  // Natural languages first (short-circuit before tech patterns)
  if (/^(english|filipino|tagalog|spanish|french|mandarin|japanese|arabic|korean|german|bisaya|cebuano|ilocano|italian|portuguese|malay|hindi|russian|dutch)$/i.test(name.trim()))
    return 'Languages'

  // UI/UX & Design
  if (/figma|adobe xd|sketch|invision|zeplin|canva|photoshop|illustrator|indesign|lightroom|ui\/ux|wireframe|prototyp|user research/i.test(n))
    return 'UI/UX Design'

  // Mobile Development
  if (/flutter|react native|swift|kotlin|android(?! studio)|xamarin|ionic/i.test(n))
    return 'Mobile Development'

  // Frontend Development (check before backend so "TypeScript" lands here)
  if (/react(?![ -]native)|vue|angular|next\.?js|nuxt|html|css|tailwind|bootstrap|sass|scss|svelte|typescript|javascript|jquery|webpack|vite|babel|figma(?! token)|stimulus/i.test(n))
    return 'Frontend Development'

  // Backend Development
  if (/node(?:\.js)?|express|django|laravel|php|spring|ruby on rails|fastapi|flask|asp\.net|\.net|golang|go(?:\s|$)|rust|python|java(?!script)|c#|c\+\+|rest api|graphql|grpc/i.test(n))
    return 'Backend Development'

  // Database
  if (/postgresql|mysql|mongodb|firebase|supabase|redis|sqlite|oracle|sql\s|dynamodb|elasticsearch|prisma|sequelize|typeorm/i.test(n))
    return 'Database'

  // Cloud & DevOps
  if (/aws|azure|gcp|google cloud|heroku|vercel|netlify|digitalocean|cloudflare|kubernetes|k8s|terraform|ansible|jenkins|github actions|ci\/cd|devops|nginx|apache|linux server/i.test(n))
    return 'Cloud & DevOps'

  // Developer Tools
  if (/git(?:hub|lab)?|docker|postman|insomnia|swagger|jira|notion|trello|vs code|intellij|xcode|android studio|npm|yarn|pnpm/i.test(n))
    return 'Dev Tools'

  // Productivity Tools
  if (/microsoft office|excel|word|powerpoint|google docs|google sheets|google slides|google workspace|sharepoint|outlook|slack|zoom|ms teams/i.test(n))
    return 'Productivity Tools'

  // Soft Skills
  if (/communication|teamwork|leadership|problem.solv|time management|customer service|adaptab|attention to detail|creative|active listen|multitask|organi[sz]|conflict|negotiat|presentation|public speaking|collaboration|interpersonal/i.test(n))
    return 'Soft Skills'

  return 'Technical Skills'
}

// ─── SkillsForm ───────────────────────────────────────────────────────────────

export function SkillsForm() {
  const skills       = useBuilderStore(s => s.skills)
  const personal     = useBuilderStore(s => s.personal)
  const experience   = useBuilderStore(s => s.experience)
  const addSkill     = useBuilderStore(s => s.addSkill)
  const removeSkill  = useBuilderStore(s => s.removeSkill)

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

  // Build category groups — includes ALL categories (legacy + descriptive)
  const byCategory = skills.reduce<Record<string, SkillEntry[]>>((acc, sk) => {
    const cat = sk.category || 'Technical Skills'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(sk)
    return acc
  }, {})

  return (
    <div className="space-y-6">

      {/* ── ① Add a Skill ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800">What are you good at?</p>
        <p className="text-xs text-gray-500">
          Add anything you can actually do — e.g. <em>Customer Service</em>, <em>Microsoft Excel</em>, <em>Driving</em>, <em>Cashiering</em>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder="Type a skill and press Enter or tap +"
            className="flex-1 rounded-[3px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <button
            onClick={() => handleAdd()}
            className="rounded-[3px] px-4 py-2.5 text-white font-semibold text-sm shrink-0 transition-all hover:opacity-90"
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
                className="flex items-center gap-1 rounded-[3px] border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <Plus className="h-3 w-3" /> {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ③ AI suggestions ──────────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-[3px] p-3 flex items-center gap-3 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Not sure what to add?</p>
          <p className="text-xs text-gray-500 mt-0.5">Let us suggest skills that match your target job — just tap below.</p>
        </div>
        <button
          onClick={handleSuggest}
          disabled={isPending}
          className="shrink-0 flex items-center gap-1.5 rounded-[3px] px-3 py-2 text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: 'var(--melo-gradient)' }}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isPending ? 'Loading…' : 'Suggest Skills'}
        </button>
      </div>

      {/* Suggestion chips */}
      {showSugg && suggestions.length > 0 && (
        <div className="border border-purple-200 rounded-[3px] bg-white p-3 space-y-2">
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
                className="flex items-center gap-1.5 rounded-[3px] border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm text-purple-800 font-medium hover:bg-purple-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> {skill.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[3px] px-3 py-2">
          {(error as Error).message}
        </p>
      )}

      {/* ── ④ Your Skills (bullet list) ───────────────────────────────────── */}
      {skills.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-800">Your Skills ({skills.length})</p>
          {Object.keys(byCategory).map(cat => (
            <div key={cat} className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full shrink-0', getCatDot(cat))} />
                {cat}
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
                      className="text-red-400 hover:text-red-600 focus:text-red-600 transition-colors shrink-0 p-0.5 rounded"
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
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-[3px]">
          <p className="text-sm text-gray-500">No skills added yet 💪</p>
          <p className="text-xs text-gray-400 mt-1">Type any skill above — or tap from the common list. Aim for at least 5–8.</p>
        </div>
      )}


    </div>
  )
}
