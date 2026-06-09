import { useState } from 'react'
import { Plus, X, Sparkles, Loader2 } from 'lucide-react'
import { useBuilderStore } from '@/store/builder.store'
import { useSuggestSkills } from '@/features/resume/hooks/useAI'
import type { SkillEntry } from '@/store/builder.store'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 6

// Quick-add common skills (no category tabs — just the most universal ones)
const QUICK_SKILLS = [
  'Microsoft Office', 'Excel', 'Google Workspace', 'PowerPoint',
  'Communication', 'Teamwork', 'Leadership', 'Problem Solving',
  'Python', 'JavaScript', 'SQL', 'React',
  'Photoshop', 'Figma', 'Canva', 'Git',
  'Customer Service', 'Time Management', 'English',
]

function guessCategory(name: string): SkillEntry['category'] {
  const lower = name.toLowerCase()
  if (/english|filipino|spanish|french|mandarin|japanese|arabic|korean/i.test(name)) return 'language'
  if (/react|vue|angular|django|laravel|express|next|nuxt|spring/i.test(name)) return 'framework'
  if (/aws|azure|gcp|cloud|docker|kubernetes|linux|server/i.test(name)) return 'platform'
  if (/git|figma|jira|postman|notion|slack|vs code|xcode/i.test(name)) return 'tool'
  if (/communication|teamwork|leadership|problem|time|management|customer|adaptability|attention/i.test(lower)) return 'soft'
  return 'technical'
}

const CAT_PILL: Record<string, string> = {
  technical: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  soft:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  language:  'bg-rose-50 text-rose-700 border-rose-200',
  framework: 'bg-violet-50 text-violet-700 border-violet-200',
  platform:  'bg-cyan-50 text-cyan-700 border-cyan-200',
  tool:      'bg-orange-50 text-orange-700 border-orange-200',
}

export function SkillsForm() {
  const skills      = useBuilderStore(s => s.skills)
  const personal    = useBuilderStore(s => s.personal)
  const experience  = useBuilderStore(s => s.experience)
  const addSkill    = useBuilderStore(s => s.addSkill)
  const removeSkill = useBuilderStore(s => s.removeSkill)

  const [newName, setNewName]               = useState('')
  const [suggestions, setSuggestions]       = useState<SkillEntry[]>([])
  const [suggPage, setSuggPage]             = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)

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
        const fresh = suggested.filter(s => !names.has(s.name.toLowerCase()))
        setSuggestions(fresh)
        setSuggPage(0)
        setShowSuggestions(true)
      },
    })
  }

  function addFromSuggestion(skill: SkillEntry) {
    if (!skills.some(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
      addSkill(skill)
    }
    setSuggestions(prev => prev.filter(s => s.id !== skill.id))
  }

  function addAllPage() {
    const start = suggPage * PAGE_SIZE
    suggestions.slice(start, start + PAGE_SIZE).forEach(s => {
      if (!skills.some(sk => sk.name.toLowerCase() === s.name.toLowerCase())) {
        addSkill(s)
      }
    })
    setSuggestions(prev => {
      const next = prev.filter((_, i) => i < start || i >= start + PAGE_SIZE)
      if (next.length === 0) setShowSuggestions(false)
      return next
    })
    setSuggPage(0)
  }

  const quickFiltered = QUICK_SKILLS.filter(
    n => !skills.some(s => s.name.toLowerCase() === n.toLowerCase())
  ).slice(0, 6)

  // AI suggestion pagination
  const totalPages   = Math.ceil(suggestions.length / PAGE_SIZE)
  const pageStart    = suggPage * PAGE_SIZE
  const pageItems    = suggestions.slice(pageStart, pageStart + PAGE_SIZE)
  const hasNextPage  = suggPage < totalPages - 1
  const hasPrevPage  = suggPage > 0

  // Group displayed skills
  const CATS = ['technical', 'framework', 'platform', 'tool', 'soft', 'language'] as const
  const byCategory = CATS.reduce<Record<string, SkillEntry[]>>((acc, cat) => {
    const items = skills.filter(s => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="space-y-5">

      {/* ── AI Suggest ── */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 flex items-center gap-3">
        <div className="rounded-lg bg-purple-100 p-1.5 shrink-0">
          <Sparkles className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800">AI Skill Suggestions</p>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
            Based on your job target &amp; experience — tap to add.
          </p>
        </div>
        <button
          onClick={handleSuggest}
          disabled={isPending}
          className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: 'var(--melo-gradient)' }}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isPending ? 'Loading…' : 'Suggest'}
        </button>
      </div>

      {/* AI suggestions panel */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="rounded-xl border border-purple-100 bg-white p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
              {suggestions.length} skills found · Page {suggPage + 1}/{totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={addAllPage}
                className="text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 hover:bg-purple-100 transition-colors">
                Add Page
              </button>
              <button onClick={() => setShowSuggestions(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 6-item bullet list */}
          <ul className="space-y-1">
            {pageItems.map(skill => (
              <li key={skill.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-purple-50 transition-colors cursor-pointer group"
                onClick={() => addFromSuggestion(skill)}>
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 group-hover:text-purple-700">{skill.name}</span>
                <span className={cn(
                  'rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize',
                  CAT_PILL[skill.category] ?? CAT_PILL.technical
                )}>
                  {skill.category}
                </span>
                <Plus className="h-3.5 w-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </li>
            ))}
          </ul>

          {/* ─── divider if more pages ─── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <button onClick={() => setSuggPage(p => p - 1)} disabled={!hasPrevPage}
                className="text-[11px] text-gray-400 disabled:opacity-30 hover:text-purple-600 flex items-center gap-0.5 transition-colors">
                ‹ Prev 6
              </button>
              <span className="text-[11px] text-gray-400">── {suggestions.length - pageStart - pageItems.length} more ──</span>
              <button onClick={() => setSuggPage(p => p + 1)} disabled={!hasNextPage}
                className="text-[11px] text-gray-400 disabled:opacity-30 hover:text-purple-600 flex items-center gap-0.5 transition-colors">
                Next 6 ›
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
          {(error as Error).message}
        </div>
      )}

      {/* ── Manual add ── */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Add Manually</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder="Type a skill and press Enter…"
            className="flex-1 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <button
            onClick={() => handleAdd()}
            className="rounded-xl px-3 py-2.5 text-white shrink-0 transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--melo-gradient)' }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400">Category is auto-detected. Press Enter to add.</p>
      </div>

      {/* ── Quick add ── */}
      {quickFiltered.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Quick Add</p>
          <div className="flex flex-wrap gap-1.5">
            {quickFiltered.map(name => (
              <button
                key={name}
                onClick={() => addSkill({ name, category: guessCategory(name), level: 'intermediate' })}
                className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <Plus className="h-3 w-3" />{name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Your skills ── */}
      {skills.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Your Skills ({skills.length})
          </p>
          {CATS.filter(cat => byCategory[cat]).map(cat => (
            <div key={cat}>
              <div className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize mb-1.5', CAT_PILL[cat])}>
                {cat}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {byCategory[cat].map(skill => (
                  <div key={skill.id}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:border-red-200 group transition-colors">
                    <span className="font-medium">{skill.name}</span>
                    <button type="button" onClick={() => removeSkill(skill.id)}
                      className="text-gray-300 group-hover:text-red-400 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
          <Sparkles className="h-7 w-7 text-purple-200 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">No skills added yet</p>
          <p className="text-xs text-gray-400 mt-1">Click <strong>Suggest</strong> for AI picks, or type above.</p>
        </div>
      )}

    </div>
  )
}
