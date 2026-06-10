import { useRef, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBuilderStore } from '@/store/builder.store'
import { useMutation } from '@tanstack/react-query'
import { callGroq, GROQ_MODELS } from '@/lib/groq'
import type { EducationEntry } from '@/store/builder.store'
import { EDU_LEVELS, DEGREES_BY_LEVEL, inferLevel } from '@/data/degrees'
import type { EduLevel } from '@/data/degrees'
import { cn } from '@/lib/utils'

// ─── Honors quick-picks ───────────────────────────────────────────────────────

const HONORS = [
  'Summa Cum Laude', 'Magna Cum Laude', 'Cum Laude',
  "Dean's List", 'With Honors', 'With High Honors',
  'University Scholar', 'Class Valedictorian', 'Class Salutatorian',
  "President's Lister", "Director's Lister",
]

// ─── Degree search combobox ───────────────────────────────────────────────────

interface DegreePickerProps {
  level: EduLevel
  value: string
  onChange: (v: string) => void
}

function DegreePicker({ level, value, onChange }: DegreePickerProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen]   = useState(false)
  const inputRef          = useRef<HTMLInputElement>(null)

  const list = DEGREES_BY_LEVEL[level] ?? []
  const filtered = query.trim()
    ? list.filter(d => d.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 10)
    : list.slice(0, 10)

  function pick(deg: string) {
    onChange(deg)
    setQuery(deg)
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search or type your degree…"
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          className="w-full rounded-[2px] border border-gray-300 pl-9 pr-8 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setQuery(''); onChange(''); inputRef.current?.focus() }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-[2px] border border-gray-200 bg-white shadow-lg text-sm">
          {filtered.map(deg => (
            <li key={deg}>
              <button
                type="button"
                className={cn(
                  'w-full text-left px-3 py-2 hover:bg-purple-50 hover:text-purple-800 transition-colors',
                  deg === value && 'bg-purple-50 text-purple-800 font-medium'
                )}
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(deg)}
              >
                {deg}
              </button>
            </li>
          ))}
          {/* custom entry if nothing matches exactly */}
          {query.trim() && !list.some(d => d.toLowerCase() === query.trim().toLowerCase()) && (
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-purple-700 italic hover:bg-purple-50 transition-colors border-t border-gray-100"
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(query.trim())}
              >
                Use "{query.trim()}"
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ─── Per-entry component — MUST stay OUTSIDE EducationForm.
//     Defining it inside causes React to unmount/remount on every render,
//     breaking focus after one keystroke and preventing Select from opening.
// ─────────────────────────────────────────────────────────────────────────────

interface EntryProps {
  entryId: string
  expandedId: string | null
  setExpandedId: (id: string | null) => void
}

function EducationEntry({ entryId, expandedId, setExpandedId }: EntryProps) {
  const entry       = useBuilderStore(s => s.education.find(e => e.id === entryId))
  const updateEntry = useBuilderStore(s => s.updateEducation)
  const removeEntry = useBuilderStore(s => s.removeEducation)
  const groqApiKey  = useBuilderStore(s => s.groqApiKey)

  // Infer level from existing degree string (for users who had data before this update)
  const [level, setLevel] = useState<EduLevel | ''>(() => inferLevel(entry?.degree ?? ''))

  if (!entry) return null

  const isExpanded = expandedId === entryId

  function upd(field: keyof EducationEntry, value: string) {
    updateEntry(entryId, { [field]: value } as Partial<EducationEntry>)
  }

  function selectLevel(lv: EduLevel) {
    setLevel(lv)
    // Clear degree when switching level so stale value doesn't confuse search
    upd('degree', '')
  }

  const { mutate: suggestHonors, isPending: suggesting } = useMutation({
    mutationFn: async () => callGroq(
      [
        { role: 'system', content: "You are a career expert. Suggest 1-2 short academic honors/achievements. Output ONLY the honors text (e.g. \"Dean's List, Graduating Class 2024\"). Max 10 words." },
        { role: 'user', content: `Program: ${entry.degree} ${entry.program} at ${entry.school}. Suggest appropriate honors.` },
      ],
      40, GROQ_MODELS.ULTRAFAST, groqApiKey,
    ),
    onSuccess: (text) => upd('honors', text),
  })

  return (
    <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
      {/* ── Header row (collapsed summary) ───────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
        onClick={() => setExpandedId(isExpanded ? null : entryId)}
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-gray-900 truncate">{entry.school || 'New School'}</p>
          <p className="text-xs text-gray-500 truncate">
            {[entry.degree, entry.program].filter(Boolean).join(' · ') || 'Tap to fill in details'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <button
            className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={e => { e.stopPropagation(); removeEntry(entryId) }}
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {isExpanded
            ? <ChevronUp className="h-4 w-4 text-gray-400" />
            : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {/* ── Expanded form ─────────────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">

          {/* ① Level picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              What did you finish? <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EDU_LEVELS.map(lv => (
                <button
                  key={lv.value}
                  type="button"
                  onClick={() => selectLevel(lv.value as EduLevel)}
                  className={cn(
                    'rounded-[2px] border px-2 py-2.5 text-left transition-all',
                    level === lv.value
                      ? 'border-purple-400 bg-purple-50 text-purple-800'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  )}
                >
                  <div className="text-base leading-none mb-1">{lv.emoji}</div>
                  <div className="text-xs font-semibold leading-tight">{lv.label}</div>
                  <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{lv.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ② Degree — searchable dropdown (only when level selected) */}
          {level && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Degree / Course / Certificate
                <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
              </Label>
              <DegreePicker
                level={level}
                value={entry.degree}
                onChange={v => upd('degree', v)}
              />
              <p className="text-[11px] text-gray-400">
                Start typing to search, or type your own and press Enter.
              </p>
            </div>
          )}

          {/* ③ School / University */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              School / University <span className="text-red-400">*</span>
            </Label>
            <Input
              value={entry.school}
              onChange={e => upd('school', e.target.value)}
              placeholder="e.g. University of the Philippines, Ateneo, DLSU"
            />
          </div>

          {/* ④ Course / Major */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Course / Major / Strand
              <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
            </Label>
            <Input
              value={entry.program}
              onChange={e => upd('program', e.target.value)}
              placeholder="e.g. Computer Science, Nursing, STEM strand, Marketing"
            />
          </div>

          {/* ⑤ Years attended */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Start Year
                <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
              </Label>
              <Input
                type="number"
                value={entry.startDate}
                onChange={e => upd('startDate', e.target.value)}
                placeholder="2020"
                min="1950" max="2035"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                End Year
                <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
              </Label>
              <Input
                type="number"
                value={entry.endDate}
                onChange={e => upd('endDate', e.target.value)}
                placeholder="2024"
                min="1950" max="2035"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                GPA / Grade
                <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
              </Label>
              <Input
                type="number" step="0.01" min="1" max="5"
                value={entry.gpa}
                onChange={e => upd('gpa', e.target.value)}
                placeholder="e.g. 3.75"
              />
            </div>
          </div>

          {/* ⑥ Honors / Awards */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Honors / Awards
                <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
              </Label>
              <button
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors"
                disabled={suggesting || !entry.school}
                onClick={() => suggestHonors()}
              >
                {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Suggest
              </button>
            </div>
            <Input
              value={entry.honors}
              onChange={e => upd('honors', e.target.value)}
              placeholder="e.g. Cum Laude, Dean's List"
              list={`honors-${entryId}`}
            />
            <datalist id={`honors-${entryId}`}>
              {HONORS.map(h => <option key={h} value={h} />)}
            </datalist>
            {!entry.honors && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {HONORS.slice(0, 5).map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => upd('honors', h)}
                    className="rounded-[2px] border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Parent list ──────────────────────────────────────────────────────────────

export function EducationForm() {
  const education = useBuilderStore(s => s.education)
  const addEntry  = useBuilderStore(s => s.addEducation)

  const [expandedId, setExpandedId] = useState<string | null>(education[0]?.id ?? null)

  function handleAdd() {
    addEntry()
    setTimeout(() => {
      const updated = useBuilderStore.getState().education
      setExpandedId(updated.at(-1)?.id ?? null)
    }, 0)
  }

  return (
    <div className="space-y-3">
      {education.length === 0 && (
        <div className="text-center py-5 border border-dashed border-gray-200 rounded-[2px]">
          <p className="text-sm text-gray-500 font-medium">No education added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add your school, college, or TESDA course. Every level counts!
          </p>
        </div>
      )}

      {education.map(entry => (
        <EducationEntry
          key={entry.id}
          entryId={entry.id}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      ))}

      <Button variant="outline" className="w-full gap-2 rounded-[3px]" onClick={handleAdd}>
        <Plus className="h-4 w-4" /> Add School / Course
      </Button>
    </div>
  )
}
