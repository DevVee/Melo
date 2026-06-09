import { Plus, Trash2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateSection } from '@/features/resume/hooks/useSections'
import type { Certification } from '@/types'

type Props = { section: { id: string; content: Record<string, unknown> } }

export function CertificationsForm({ section }: Props) {
  const entries: Certification[] = ((section.content as { entries?: Certification[] }).entries ?? [])
  const { mutate: updateSection } = useUpdateSection()

  function save(e: Certification[]) { updateSection({ id: section.id, content: { entries: e } }) }
  function add() {
    save([...entries, { id: uuid(), name: '', issuing_organization: '', issue_date: '', expiration_date: '', credential_url: '' }])
  }
  function update(id: string, field: keyof Certification, value: string) {
    save(entries.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div key={entry.id} className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{entry.name || 'New Certification'}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => save(entries.filter(e => e.id !== entry.id))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Certification Name *</Label><Input value={entry.name} onChange={e => update(entry.id, 'name', e.target.value)} placeholder="AWS Solutions Architect" /></div>
            <div className="space-y-1"><Label className="text-xs">Issuing Organization</Label><Input value={entry.issuing_organization} onChange={e => update(entry.id, 'issuing_organization', e.target.value)} placeholder="Amazon Web Services" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Issue Date</Label><Input type="month" value={entry.issue_date} onChange={e => update(entry.id, 'issue_date', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Expiration Date</Label><Input type="month" value={entry.expiration_date ?? ''} onChange={e => update(entry.id, 'expiration_date', e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs">Credential URL</Label><Input value={entry.credential_url ?? ''} onChange={e => update(entry.id, 'credential_url', e.target.value)} placeholder="https://…" /></div>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={add}><Plus className="h-4 w-4" /> Add Certification</Button>
    </div>
  )
}
