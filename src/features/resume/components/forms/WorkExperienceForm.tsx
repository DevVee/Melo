/**
 * Work Experience form — uses store-level bullet actions to avoid stale
 * closure bugs. Each entry is its own sub-component for clean state isolation.
 */
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2, Wand2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBuilderStore } from '@/store/builder.store'
import { useImproveBullets, useGenerateBulletsFromRole } from '@/features/resume/hooks/useAI'

const EMPLOYMENT_TYPES = [
  { value: 'full_time',   label: 'Full-time'   },
  { value: 'part_time',   label: 'Part-time'   },
  { value: 'contract',    label: 'Contract'    },
  { value: 'internship',  label: 'Internship'  },
  { value: 'freelance',   label: 'Freelance'   },
  { value: 'volunteer',   label: 'Volunteer'   },
  { value: 'apprentice',  label: 'Apprentice'  },
]

// ─── Parent: just the list + "Add" button ─────────────────────────────────────

export function WorkExperienceForm() {
  const experience   = useBuilderStore(s => s.experience)
  const addExperience = useBuilderStore(s => s.addExperience)

  const [expandedId, setExpandedId] = useState<string | null>(experience[0]?.id ?? null)

  function handleAdd() {
    addExperience()
    // Read fresh state after Zustand update
    setTimeout(() => {
      const updated = useBuilderStore.getState().experience
      setExpandedId(updated.at(-1)?.id ?? null)
    }, 0)
  }

  return (
    <div className="space-y-3">
      {experience.map(entry => (
        <ExperienceEntry
          key={entry.id}
          entryId={entry.id}
          isExpanded={expandedId === entry.id}
          onToggle={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
        />
      ))}

      <Button variant="outline" className="w-full gap-2" onClick={handleAdd}>
        <Plus className="h-4 w-4" /> Add Work Experience
      </Button>

      {experience.length === 0 && (
        <p className="text-xs text-center text-muted-foreground py-2">
          No experience yet — click above to add your first role.
          <br />Fresh graduate? Add internships, part-time, or volunteer work!
        </p>
      )}
    </div>
  )
}

// ─── Per-entry form — reads directly from store, no prop drilling ─────────────

function ExperienceEntry({
  entryId, isExpanded, onToggle,
}: {
  entryId: string
  isExpanded: boolean
  onToggle: () => void
}) {
  // Read this specific entry from the store
  const entry        = useBuilderStore(s => s.experience.find(e => e.id === entryId))
  const updateEntry  = useBuilderStore(s => s.updateExperience)
  const removeEntry  = useBuilderStore(s => s.removeExperience)
  const updateBullet = useBuilderStore(s => s.updateBullet)
  const addBullet    = useBuilderStore(s => s.addBullet)
  const removeBullet = useBuilderStore(s => s.removeBullet)
  const setBullets   = useBuilderStore(s => s.setBullets)

  const { mutate: improve,   isPending: improving  } = useImproveBullets()
  const { mutate: generate,  isPending: generating } = useGenerateBulletsFromRole()

  if (!entry) return null

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Collapsed header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{entry.position || 'New Position'}</p>
          <p className="text-xs text-muted-foreground truncate">
            {entry.company || 'Company'}{entry.location ? ` · ${entry.location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <Button
            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={e => { e.stopPropagation(); removeEntry(entryId) }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded fields */}
      {isExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* Position + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Position / Job Title *</Label>
              <Input
                value={entry.position}
                onChange={e => updateEntry(entryId, { position: e.target.value })}
                placeholder="e.g. Barista · Software Engineer"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Company / Employer *</Label>
              <Input
                value={entry.company}
                onChange={e => updateEntry(entryId, { company: e.target.value })}
                placeholder="e.g. Starbucks · Google"
              />
            </div>
          </div>

          {/* Type + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Employment Type</Label>
              <Select value={entry.employmentType} onValueChange={v => updateEntry(entryId, { employmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input
                value={entry.location}
                onChange={e => updateEntry(entryId, { location: e.target.value })}
                placeholder="Metro Manila, PH · Remote"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="month" value={entry.startDate} onChange={e => updateEntry(entryId, { startDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="month"
                value={entry.endDate}
                disabled={entry.isCurrent}
                onChange={e => updateEntry(entryId, { endDate: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pb-2">
              <Checkbox
                checked={entry.isCurrent}
                onCheckedChange={v => updateEntry(entryId, { isCurrent: Boolean(v), endDate: v ? '' : entry.endDate })}
              />
              Current job
            </label>
          </div>

          {/* Responsibilities / Achievements */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-xs">Responsibilities & Achievements</Label>
              <div className="flex gap-1.5 flex-wrap">
                {/* AI Improve existing */}
                <Button
                  variant="outline" size="sm"
                  className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                  disabled={improving || entry.bullets.every(b => !b.trim())}
                  onClick={() => improve(
                    { bullets: entry.bullets.filter(Boolean), context: `${entry.position} at ${entry.company}` },
                    { onSuccess: (improved) => setBullets(entryId, improved) }
                  )}
                >
                  {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI Improve
                </Button>
                {/* AI Generate from scratch */}
                <Button
                  variant="outline" size="sm"
                  className="h-7 text-xs gap-1.5 border-violet-300 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                  disabled={generating || (!entry.position && !entry.company)}
                  onClick={() => generate(
                    { position: entry.position, company: entry.company, employmentType: entry.employmentType },
                    { onSuccess: (bullets) => setBullets(entryId, bullets) }
                  )}
                >
                  {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  AI Write
                </Button>
                {/* Refresh */}
                <Button
                  variant="ghost" size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={() => setBullets(entryId, ['', '', ''])}
                  title="Reset bullets"
                >
                  <RefreshCw className="h-3 w-3" /> Reset
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {entry.bullets.map((bullet, bi) => (
                <div key={`${entryId}-bullet-${bi}`} className="flex items-start gap-2">
                  <span className="mt-2.5 text-muted-foreground shrink-0 select-none text-xs">•</span>
                  <Textarea
                    value={bullet}
                    onChange={e => updateBullet(entryId, bi, e.target.value)}
                    placeholder={bi === 0
                      ? 'e.g. Increased sales by 30% through upselling techniques'
                      : bi === 1
                        ? 'e.g. Trained 5 new team members in company procedures'
                        : 'Add another responsibility or achievement…'
                    }
                    className="min-h-0 resize-none text-sm flex-1"
                    rows={2}
                  />
                  {entry.bullets.length > 1 && (
                    <button
                      onClick={() => removeBullet(entryId, bi)}
                      className="mt-2 p-1 text-muted-foreground/40 hover:text-destructive transition-colors rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground w-full border border-dashed border-border hover:border-primary/50"
              onClick={() => addBullet(entryId)}
            >
              <Plus className="h-3 w-3" /> Add bullet point
            </Button>
          </div>

          {/* AI tip */}
          {entry.bullets.every(b => !b.trim()) && !generating && (
            <div className="rounded-xl border-l-4 border-l-purple-400 border border-purple-200 bg-purple-50 p-3 text-xs leading-relaxed text-gray-700">
              <span className="font-bold text-purple-700">💡 Tip:</span>{' '}
              Click <span className="font-bold text-purple-700 bg-purple-100 rounded px-1">AI Write</span> to auto-generate bullet points from your job title &amp; company.
              Or type your own and use <span className="font-bold text-purple-700 bg-purple-100 rounded px-1">AI Improve</span> to make them more impactful.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
