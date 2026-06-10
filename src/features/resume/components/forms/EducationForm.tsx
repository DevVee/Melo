import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBuilderStore } from '@/store/builder.store'
import { useMutation } from '@tanstack/react-query'
import { callGroq, GROQ_MODELS } from '@/lib/groq'
import type { EducationEntry } from '@/store/builder.store'

const DEGREES = [
  { value: 'High School Diploma',        label: 'High School Diploma'                       },
  { value: 'Senior High School',         label: 'Senior High School (SHS)'                  },
  { value: 'Certificate',                label: 'Certificate / Short Course'                 },
  { value: 'Associate Degree',           label: 'Associate Degree'                           },
  { value: 'Bachelor of Science',        label: 'Bachelor of Science (BS)'                  },
  { value: 'Bachelor of Arts',           label: 'Bachelor of Arts (BA)'                     },
  { value: 'Bachelor of Technology',     label: 'Bachelor of Technology (BTech)'             },
  { value: 'Bachelor of Engineering',    label: 'Bachelor of Engineering (BEng)'             },
  { value: 'Bachelor of Business Admin', label: 'Bachelor of Business Administration (BBA)'  },
  { value: 'Master of Science',          label: 'Master of Science (MS)'                    },
  { value: 'Master of Arts',             label: 'Master of Arts (MA)'                       },
  { value: 'Master of Business Admin',   label: 'Master of Business Administration (MBA)'    },
  { value: 'Master of Engineering',      label: 'Master of Engineering (MEng)'               },
  { value: 'Doctor of Philosophy',       label: 'Doctor of Philosophy (PhD)'                },
  { value: 'Doctor of Medicine',         label: 'Doctor of Medicine (MD)'                   },
  { value: 'Juris Doctor',               label: 'Juris Doctor (JD)'                         },
  { value: 'Doctor of Education',        label: 'Doctor of Education (EdD)'                 },
  { value: 'Vocational / TESDA',         label: 'Vocational / TESDA NC'                     },
]

const HONORS = [
  'Summa Cum Laude', 'Magna Cum Laude', 'Cum Laude',
  "Dean's List", 'With Honors', 'With High Honors',
  'University Scholar', 'Class Valedictorian', 'Class Salutatorian',
  "President's Lister", "Director's Lister",
]

const PROGRAM_SUGGESTIONS: Record<string, string[]> = {
  'Bachelor of Science': ['Computer Science', 'Information Technology', 'Nursing', 'Engineering', 'Business Administration', 'Psychology', 'Education', 'Biology', 'Mathematics', 'Chemistry', 'Physics'],
  'Bachelor of Arts': ['English', 'Communication', 'Sociology', 'Political Science', 'Philosophy', 'History', 'Fine Arts'],
  'Bachelor of Engineering': ['Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering', 'Electronics Engineering'],
  'Master of Science': ['Computer Science', 'Data Science', 'Engineering', 'Biology'],
  'Master of Business Admin': ['Finance', 'Marketing', 'Operations', 'Human Resources', 'Entrepreneurship'],
}

// ─── Per-entry component — MUST be defined OUTSIDE EducationForm.
//     Defining it inside causes React to treat it as a new component type on
//     every render, unmounting/remounting on each keystroke → loses focus after
//     one character + Select never opens.
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

  // Local state for custom degree — initialise from existing value
  const [isCustom, setIsCustom] = useState(
    () => !!entry?.degree && !DEGREES.find(d => d.value === entry?.degree)
  )

  if (!entry) return null

  const isExpanded = expandedId === entryId

  function upd(field: keyof EducationEntry, value: string) {
    updateEntry(entryId, { [field]: value } as Partial<EducationEntry>)
  }

  const programSuggestions = PROGRAM_SUGGESTIONS[entry.degree] ?? []

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
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
        onClick={() => setExpandedId(isExpanded ? null : entryId)}
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-gray-900 truncate">{entry.school || 'New School'}</p>
          <p className="text-xs text-gray-500 truncate">
            {[entry.degree, entry.program].filter(Boolean).join(' · ') || 'Add details below'}
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

      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">

          {/* School */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">School / University *</Label>
            <Input
              value={entry.school}
              onChange={e => upd('school', e.target.value)}
              placeholder="e.g. University of the Philippines, Ateneo, DLSU"
            />
          </div>

          {/* Degree */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Degree / Qualification</Label>
            {isCustom ? (
              <div className="flex gap-2">
                <Input
                  value={entry.degree}
                  onChange={e => upd('degree', e.target.value)}
                  placeholder="Type your degree"
                  className="flex-1"
                />
                <Button
                  variant="outline" size="sm"
                  onClick={() => { setIsCustom(false); upd('degree', '') }}
                >
                  Pick list
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={entry.degree || '__none__'}
                  onValueChange={v => upd('degree', v === '__none__' ? '' : v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select degree…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select degree —</SelectItem>
                    {DEGREES.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline" size="sm" className="shrink-0"
                  onClick={() => setIsCustom(true)}
                >
                  Other
                </Button>
              </div>
            )}
          </div>

          {/* Program / Major */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Course / Major / Field of Study</Label>
            <Input
              value={entry.program}
              onChange={e => upd('program', e.target.value)}
              placeholder="e.g. Computer Science, Nursing, Marketing"
              list={`prog-${entryId}`}
            />
            {programSuggestions.length > 0 && (
              <datalist id={`prog-${entryId}`}>
                {programSuggestions.map(p => <option key={p} value={p} />)}
              </datalist>
            )}
            {programSuggestions.length > 0 && !entry.program && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {programSuggestions.slice(0, 6).map(p => (
                  <button
                    key={p}
                    onClick={() => upd('program', p)}
                    className="rounded border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year + GPA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Start Year</Label>
              <Input
                type="number"
                value={entry.startDate}
                onChange={e => upd('startDate', e.target.value)}
                placeholder="2020"
                min="1950" max="2030"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">End Year</Label>
              <Input
                type="number"
                value={entry.endDate}
                onChange={e => upd('endDate', e.target.value)}
                placeholder="2024 or Present"
                min="1950" max="2030"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">GPA / Grade</Label>
              <Input
                type="number" step="0.01" min="1" max="5"
                value={entry.gpa}
                onChange={e => upd('gpa', e.target.value)}
                placeholder="e.g. 3.75"
              />
            </div>
          </div>

          {/* Honors */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Honors / Awards</Label>
              <button
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors"
                disabled={suggesting}
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
                    onClick={() => upd('honors', h)}
                    className="rounded border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
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
      {education.map(entry => (
        <EducationEntry
          key={entry.id}
          entryId={entry.id}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      ))}

      <Button variant="outline" className="w-full gap-2" onClick={handleAdd}>
        <Plus className="h-4 w-4" /> Add Education
      </Button>

      {education.length === 0 && (
        <p className="text-sm text-center text-gray-500 py-3">
          Add your school, college, or training course here.
        </p>
      )}
    </div>
  )
}
