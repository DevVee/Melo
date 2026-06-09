import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateSection } from '@/features/resume/hooks/useSections'
import { useGenerateProjectDescription } from '@/features/resume/hooks/useAI'
import type { Project } from '@/types'

type Props = { section: { id: string; content: Record<string, unknown> } }

export function ProjectsForm({ section }: Props) {
  const entries: Project[] = ((section.content as { entries?: Project[] }).entries ?? [])
  const [expanded, setExpanded] = useState<string | null>(entries[0]?.id ?? null)
  const { mutate: updateSection } = useUpdateSection()
  const { mutate: genDesc, isPending } = useGenerateProjectDescription()

  function save(e: Project[]) { updateSection({ id: section.id, content: { entries: e } }) }
  function addEntry() {
    const e: Project = { id: uuid(), name: '', description: '', technologies: [], role: '', start_date: '', end_date: '', project_url: '', github_url: '' }
    save([...entries, e]); setExpanded(e.id)
  }
  function update(id: string, field: keyof Project, value: unknown) {
    save(entries.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div key={entry.id} className="rounded-lg border border-border">
          <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
            <p className="font-medium text-sm">{entry.name || 'New Project'}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); save(entries.filter(e2 => e2.id !== entry.id)) }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {expanded === entry.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          {expanded === entry.id && (
            <div className="border-t border-border p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Project Name *</Label><Input value={entry.name} onChange={e => update(entry.id, 'name', e.target.value)} placeholder="Portfolio Website" /></div>
                <div className="space-y-1"><Label className="text-xs">Your Role</Label><Input value={entry.role ?? ''} onChange={e => update(entry.id, 'role', e.target.value)} placeholder="Full Stack Developer" /></div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Description</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" disabled={isPending}
                    onClick={() => genDesc({ name: entry.name, role: entry.role ?? '', technologies: entry.technologies }, {
                      onSuccess: desc => update(entry.id, 'description', desc),
                    })}>
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Generate
                  </Button>
                </div>
                <Textarea value={entry.description} onChange={e => update(entry.id, 'description', e.target.value)} placeholder="Describe what the project does and your contribution…" />
              </div>
              <div className="space-y-1"><Label className="text-xs">Technologies</Label><Input value={entry.technologies.join(', ')} onChange={e => update(entry.id, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} placeholder="React, TypeScript, Supabase" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Project URL</Label><Input value={entry.project_url ?? ''} onChange={e => update(entry.id, 'project_url', e.target.value)} placeholder="https://…" /></div>
                <div className="space-y-1"><Label className="text-xs">GitHub URL</Label><Input value={entry.github_url ?? ''} onChange={e => update(entry.id, 'github_url', e.target.value)} placeholder="https://github.com/…" /></div>
              </div>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={addEntry}><Plus className="h-4 w-4" /> Add Project</Button>
    </div>
  )
}
