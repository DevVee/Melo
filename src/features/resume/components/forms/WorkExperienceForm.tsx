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
import { MonthYearPicker } from '@/components/ui/MonthYearPicker'
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
    <div className="rounded-[3px] border border-border bg-card overflow-hidden">
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
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                What's your job title? <span className="text-red-400">*</span>
              </Label>
              <Input
                value={entry.position}
                onChange={e => updateEntry(entryId, { position: e.target.value })}
                placeholder="e.g. Customer Service Rep, Barista, Developer"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Where did you work? <span className="text-red-400">*</span>
              </Label>
              <Input
                value={entry.company}
                onChange={e => updateEntry(entryId, { company: e.target.value })}
                placeholder="e.g. Starbucks, BDO, Globe Telecom"
              />
            </div>
          </div>

          {/* Type + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">How were you employed?</Label>
              <Select value={entry.employmentType} onValueChange={v => updateEntry(entryId, { employmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Where was this job?
                <span className="ml-1 font-normal text-gray-400">optional</span>
              </Label>
              <Input
                value={entry.location}
                onChange={e => updateEntry(entryId, { location: e.target.value })}
                placeholder="e.g. Makati City · Remote"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">When did you start?</Label>
              <MonthYearPicker
                value={entry.startDate}
                onChange={val => updateEntry(entryId, { startDate: val })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">When did you finish?</Label>
              <MonthYearPicker
                value={entry.endDate}
                disabled={entry.isCurrent}
                onChange={val => updateEntry(entryId, { endDate: val })}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer pb-2">
              <Checkbox
                checked={entry.isCurrent}
                onCheckedChange={v => updateEntry(entryId, { isCurrent: Boolean(v), endDate: v ? '' : entry.endDate })}
              />
              I still work here
            </label>
          </div>

          {/* Responsibilities / Achievements */}
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xs font-semibold text-gray-700">
                  What did you do there?
                  <span className="ml-1 font-normal text-gray-400">— write up to 5 bullet points</span>
                </Label>
                <div className="flex gap-1.5 flex-wrap">
                  {/* AI Write from scratch */}
                  <Button
                    variant="outline" size="sm"
                    className="h-7 text-xs gap-1.5 rounded-[3px] border-violet-300 text-violet-600 hover:bg-violet-50"
                    disabled={generating || (!entry.position && !entry.company)}
                    onClick={() => generate(
                      { position: entry.position, company: entry.company, employmentType: entry.employmentType },
                      { onSuccess: (bullets) => setBullets(entryId, bullets) }
                    )}
                  >
                    {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    {generating ? 'Writing…' : 'Write for me'}
                  </Button>
                  {/* AI Improve existing */}
                  <Button
                    variant="outline" size="sm"
                    className="h-7 text-xs gap-1.5 rounded-[3px] border-purple-200 text-purple-600 hover:bg-purple-50"
                    disabled={improving || entry.bullets.every(b => !b.trim())}
                    onClick={() => improve(
                      { bullets: entry.bullets.filter(Boolean), context: `${entry.position} at ${entry.company}` },
                      { onSuccess: (improved) => setBullets(entryId, improved) }
                    )}
                  >
                    {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {improving ? 'Improving…' : 'Make it better'}
                  </Button>
                  {/* Reset */}
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 text-xs gap-1 rounded-[3px] text-gray-400 hover:text-gray-600"
                    onClick={() => setBullets(entryId, ['', '', ''])}
                    title="Clear all bullets"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Start with a strong action verb — e.g. "Led", "Built", "Reduced", "Managed"
              </p>
            </div>

            <div className="space-y-2">
              {entry.bullets.map((bullet, bi) => (
                <div key={`${entryId}-bullet-${bi}`} className="flex items-start gap-2">
                  <span className="mt-2.5 text-gray-400 shrink-0 select-none text-xs font-bold">{bi + 1}.</span>
                  <Textarea
                    value={bullet}
                    onChange={e => updateBullet(entryId, bi, e.target.value)}
                    placeholder={
                      bi === 0
                        ? 'e.g. Managed daily customer inquiries for 50+ clients, achieving 95% satisfaction'
                        : bi === 1
                          ? 'e.g. Trained 3 new team members on store procedures and product knowledge'
                          : 'e.g. Consistently met monthly targets and contributed to 20% revenue growth'
                    }
                    className="min-h-0 resize-none text-sm flex-1 rounded-[3px]"
                    rows={2}
                  />
                  {entry.bullets.length > 1 && (
                    <button
                      onClick={() => removeBullet(entryId, bi)}
                      className="mt-2 p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs gap-1 rounded-[3px] text-gray-400 w-full border border-dashed border-gray-200 hover:border-purple-300 hover:text-purple-500"
              onClick={() => addBullet(entryId)}
            >
              <Plus className="h-3 w-3" /> Add another point
            </Button>
          </div>

          {/* AI nudge — show when bullets are empty */}
          {entry.bullets.every(b => !b.trim()) && !generating && (
            <div className="rounded-[3px] border-l-4 border-l-purple-400 border border-purple-100 bg-purple-50 px-3 py-2.5 text-xs leading-relaxed text-gray-700">
              <span className="font-bold text-purple-700">Not sure what to write?</span>{' '}
              Tap <span className="font-semibold text-violet-600">"Write for me"</span> — just fill in the job title and company first.
              Already have something? Use <span className="font-semibold text-purple-600">"Make it better"</span> to sharpen it.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
