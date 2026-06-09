import { useState } from 'react'
import { Plus, X, Sparkles, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBuilderStore } from '@/store/builder.store'
import { useSuggestSkills } from '@/features/resume/hooks/useAI'
import type { SkillEntry } from '@/store/builder.store'

const CATEGORIES = ['technical', 'soft', 'language', 'framework', 'platform', 'tool'] as const
const LEVELS      = ['beginner', 'intermediate', 'advanced', 'expert'] as const

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  advanced:     'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  expert:       'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
}

const CAT_COLORS: Record<string, string> = {
  technical:  'bg-indigo-50  border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300',
  soft:       'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  language:   'bg-rose-50    border-rose-200    text-rose-800   dark:bg-rose-950/40   dark:text-rose-300',
  framework:  'bg-violet-50  border-violet-200  text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
  platform:   'bg-cyan-50    border-cyan-200    text-cyan-800   dark:bg-cyan-950/40   dark:text-cyan-300',
  tool:       'bg-orange-50  border-orange-200  text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
}

// Common quick-add skills by category for fast selection
const QUICK_SKILLS: Record<string, string[]> = {
  technical:  ['Microsoft Office', 'Google Workspace', 'Excel', 'PowerPoint', 'Data Entry', 'SQL', 'Python', 'JavaScript', 'React', 'Photoshop'],
  soft:       ['Communication', 'Teamwork', 'Leadership', 'Problem-solving', 'Time Management', 'Adaptability', 'Customer Service', 'Attention to Detail'],
  framework:  ['React', 'Node.js', 'Django', 'Laravel', 'Spring Boot', 'Angular', 'Vue.js', 'Express.js'],
  platform:   ['AWS', 'Google Cloud', 'Azure', 'Vercel', 'Heroku', 'Docker', 'Linux', 'Windows Server'],
  tool:       ['Git', 'VS Code', 'Figma', 'Jira', 'Slack', 'Notion', 'Canva', 'Postman'],
  language:   ['English', 'Filipino', 'Spanish', 'Mandarin', 'Japanese', 'Korean', 'French', 'Arabic'],
}

export function SkillsForm() {
  const skills      = useBuilderStore(s => s.skills)
  const personal    = useBuilderStore(s => s.personal)
  const experience  = useBuilderStore(s => s.experience)
  const addSkill    = useBuilderStore(s => s.addSkill)
  const removeSkill = useBuilderStore(s => s.removeSkill)

  const [newName, setNewName]         = useState('')
  const [newCategory, setNewCategory] = useState<typeof CATEGORIES[number]>('technical')
  const [newLevel, setNewLevel]       = useState<typeof LEVELS[number]>('intermediate')
  const [activeTab, setActiveTab]     = useState<typeof CATEGORIES[number]>('technical')

  const { mutate: suggest, isPending, error } = useSuggestSkills()

  function handleAdd(name = newName) {
    const trimmed = name.trim()
    if (!trimmed) return
    if (skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return
    addSkill({ name: trimmed, category: newCategory, level: newLevel })
    setNewName('')
  }

  function handleSuggest() {
    suggest(
      { personal, experience },
      {
        onSuccess: (suggested) => {
          const names = new Set(skills.map(s => s.name.toLowerCase()))
          suggested
            .filter(s => !names.has(s.name.toLowerCase()))
            .forEach(s => addSkill(s))
        },
      }
    )
  }

  const byCategory = CATEGORIES.reduce<Record<string, SkillEntry[]>>((acc, cat) => {
    const items = skills.filter(s => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  const quickSuggestions = (QUICK_SKILLS[activeTab] ?? []).filter(
    name => !skills.some(s => s.name.toLowerCase() === name.toLowerCase())
  ).slice(0, 8)

  return (
    <div className="space-y-5">
      {/* AI Suggest banner */}
      <div className="rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 to-violet-500/5 p-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 shrink-0">
          <Wand2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">AI Skill Suggestions</p>
          <p className="text-xs text-muted-foreground mt-0.5">Based on your job target and experience — gets smarter with each step you fill in.</p>
        </div>
        <Button
          variant="outline"
          className="shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
          disabled={isPending}
          onClick={handleSuggest}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isPending ? 'Suggesting…' : 'Suggest Skills'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {(error as Error).message}
        </div>
      )}

      {/* Add manually */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add manually</p>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Input
            placeholder="Type a skill and press Enter…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="flex-1"
          />
          <Select value={newCategory} onValueChange={v => setNewCategory(v as typeof CATEGORIES[number])}>
            <SelectTrigger className="w-32 sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={newLevel} onValueChange={v => setNewLevel(v as typeof LEVELS[number])}>
            <SelectTrigger className="w-32 sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => handleAdd()} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick-add by category */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick add</p>
        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                activeTab === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50 text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Quick skill chips */}
        {quickSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestions.map(name => (
              <button
                key={name}
                onClick={() => {
                  addSkill({ name, category: activeTab, level: 'intermediate' })
                }}
                className="rounded-full border border-dashed border-border px-3 py-1 text-xs hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current skills */}
      {Object.keys(byCategory).length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Your skills ({skills.length})
          </p>
          {CATEGORIES.filter(cat => byCategory[cat]).map(cat => (
            <div key={cat}>
              <p className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mb-2 ${CAT_COLORS[cat]}`}>
                {cat}
              </p>
              <div className="flex flex-wrap gap-2">
                {byCategory[cat].map(skill => (
                  <div
                    key={skill.id}
                    className="group flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:border-primary/50 transition-colors"
                  >
                    <span className="font-medium">{skill.name}</span>
                    {skill.level && (
                      <span className={`rounded-full px-1.5 py-0.5 text-xs ${LEVEL_COLORS[skill.level] || LEVEL_COLORS.intermediate}`}>
                        {skill.level}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors ml-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No skills added yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Suggest Skills" for AI recommendations, or add them manually above.
          </p>
        </div>
      )}
    </div>
  )
}
