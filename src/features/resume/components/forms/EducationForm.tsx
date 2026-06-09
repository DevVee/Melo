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
  { value: 'High School Diploma',       label: 'High School Diploma'       },
  { value: 'Senior High School',        label: 'Senior High School (SHS)'  },
  { value: 'Certificate',               label: 'Certificate / Short Course' },
  { value: 'Associate Degree',          label: 'Associate Degree'           },
  { value: 'Bachelor of Science',       label: "Bachelor of Science (BS)"  },
  { value: 'Bachelor of Arts',          label: "Bachelor of Arts (BA)"     },
  { value: 'Bachelor of Technology',    label: "Bachelor of Technology (BTech)" },
  { value: 'Bachelor of Engineering',   label: "Bachelor of Engineering (BEng)" },
  { value: 'Bachelor of Business Admin',label: "Bachelor of Business Administration (BBA)" },
  { value: 'Master of Science',         label: 'Master of Science (MS)'    },
  { value: 'Master of Arts',            label: 'Master of Arts (MA)'       },
  { value: 'Master of Business Admin',  label: 'Master of Business Administration (MBA)' },
  { value: 'Master of Engineering',     label: 'Master of Engineering (MEng)' },
  { value: 'Doctor of Philosophy',      label: 'Doctor of Philosophy (PhD)' },
  { value: 'Doctor of Medicine',        label: 'Doctor of Medicine (MD)'   },
  { value: 'Juris Doctor',              label: 'Juris Doctor (JD)'         },
  { value: 'Doctor of Education',       label: 'Doctor of Education (EdD)' },
  { value: 'Vocational / TESDA',        label: 'Vocational / TESDA NC'     },
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

export function EducationForm() {
  const education    = useBuilderStore(s => s.education)
  const addEntry     = useBuilderStore(s => s.addEducation)
  const updateEntry  = useBuilderStore(s => s.updateEducation)
  const removeEntry  = useBuilderStore(s => s.removeEducation)
  const groqApiKey   = useBuilderStore(s => s.groqApiKey)

  const [expandedId, setExpandedId] = useState<string | null>(education[0]?.id ?? null)
  const [customDegree, setCustomDegree] = useState<Record<string, boolean>>({})

  function handleAdd() {
    addEntry()
    setTimeout(() => {
      const updated = useBuilderStore.getState().education
      setExpandedId(updated.at(-1)?.id ?? null)
    }, 0)
  }

  function upd(id: string, field: keyof EducationEntry, value: string) {
    updateEntry(id, { [field]: value } as Partial<EducationEntry>)
  }

  function EducationEntryForm({ entry }: { entry: EducationEntry }) {
    const isExpanded = expandedId === entry.id
    const isCustom = customDegree[entry.id] || !DEGREES.find(d => d.value === entry.degree)

    const { mutate: suggestHonors, isPending: suggesting } = useMutation({
      mutationFn: async () => callGroq(
        [
          { role: 'system', content: 'You are a career expert. Suggest 1-2 short academic honors/achievements for a resume. Output ONLY the honors text (e.g. "Dean\'s List, Graduating Class 2024"). Max 10 words.' },
          { role: 'user', content: `Program: ${entry.degree} ${entry.program} at ${entry.school}. Suggest appropriate honors.` },
        ],
        40, GROQ_MODELS.ULTRAFAST, groqApiKey,
      ),
      onSuccess: (text) => upd(entry.id, 'honors', text),
    })

    const programSuggestions = PROGRAM_SUGGESTIONS[entry.degree] ?? []

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{entry.school || 'New School'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[entry.degree, entry.program].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={e => { e.stopPropagation(); removeEntry(entry.id) }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
            {/* School */}
            <div className="space-y-1">
              <Label className="text-xs">School / University *</Label>
              <Input
                value={entry.school}
                onChange={e => upd(entry.id, 'school', e.target.value)}
                placeholder="University of the Philippines · Ateneo · UP Diliman"
              />
            </div>

            {/* Degree selector */}
            <div className="space-y-1">
              <Label className="text-xs">Degree / Qualification</Label>
              {isCustom ? (
                <div className="flex gap-2">
                  <Input
                    value={entry.degree}
                    onChange={e => upd(entry.id, 'degree', e.target.value)}
                    placeholder="Type your degree"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost" size="sm" className="text-xs"
                    onClick={() => { setCustomDegree(p => ({ ...p, [entry.id]: false })); upd(entry.id, 'degree', '') }}
                  >
                    Pick from list
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={entry.degree}
                    onValueChange={v => upd(entry.id, 'degree', v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select degree…" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost" size="sm" className="text-xs shrink-0"
                    onClick={() => setCustomDegree(p => ({ ...p, [entry.id]: true }))}
                  >
                    Custom
                  </Button>
                </div>
              )}
            </div>

            {/* Program */}
            <div className="space-y-1">
              <Label className="text-xs">Program / Major / Field of Study</Label>
              <Input
                value={entry.program}
                onChange={e => upd(entry.id, 'program', e.target.value)}
                placeholder="Computer Science · Marketing · Nursing"
                list={`prog-${entry.id}`}
              />
              {programSuggestions.length > 0 && (
                <datalist id={`prog-${entry.id}`}>
                  {programSuggestions.map(p => <option key={p} value={p} />)}
                </datalist>
              )}
              {programSuggestions.length > 0 && !entry.program && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {programSuggestions.slice(0, 6).map(p => (
                    <button
                      key={p}
                      onClick={() => upd(entry.id, 'program', p)}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dates + GPA */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start Year</Label>
                <Input
                  type="number"
                  value={entry.startDate}
                  onChange={e => upd(entry.id, 'startDate', e.target.value)}
                  placeholder="2020"
                  min="1950" max="2030"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Year</Label>
                <Input
                  type="number"
                  value={entry.endDate}
                  onChange={e => upd(entry.id, 'endDate', e.target.value)}
                  placeholder="Present"
                  min="1950" max="2030"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">GPA / Grade</Label>
                <Input
                  type="number" step="0.01" min="1" max="5"
                  value={entry.gpa}
                  onChange={e => upd(entry.id, 'gpa', e.target.value)}
                  placeholder="3.75"
                />
              </div>
            </div>

            {/* Honors */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Honors / Awards / Achievements</Label>
                <Button
                  variant="ghost" size="sm"
                  className="h-6 text-xs gap-1 text-primary"
                  disabled={suggesting}
                  onClick={() => suggestHonors()}
                >
                  {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI Suggest
                </Button>
              </div>
              <Input
                value={entry.honors}
                onChange={e => upd(entry.id, 'honors', e.target.value)}
                placeholder="Cum Laude, Dean's List 3rd Year"
                list={`honors-${entry.id}`}
              />
              <datalist id={`honors-${entry.id}`}>
                {HONORS.map(h => <option key={h} value={h} />)}
              </datalist>
              {/* Quick pick */}
              {!entry.honors && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {HONORS.slice(0, 5).map(h => (
                    <button
                      key={h}
                      onClick={() => upd(entry.id, 'honors', h)}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary transition-colors"
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

  return (
    <div className="space-y-3">
      {education.map(entry => <EducationEntryForm key={entry.id} entry={entry} />)}

      <Button variant="outline" className="w-full gap-2" onClick={handleAdd}>
        <Plus className="h-4 w-4" /> Add Education
      </Button>

      {education.length === 0 && (
        <p className="text-xs text-center text-muted-foreground py-2">
          Add your schools, colleges, or courses here.
        </p>
      )}
    </div>
  )
}
