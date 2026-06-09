import { useResumeStore } from '@/store/resume.store'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TEMPLATE_CATEGORY_LABELS } from '@/constants'

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Sans-serif)' },
  { value: 'Georgia', label: 'Georgia (Serif)' },
  { value: 'Times New Roman', label: 'Times New Roman (Classic)' },
  { value: 'Calibri', label: 'Calibri (Modern)' },
  { value: 'Arial', label: 'Arial (Clean)' },
  { value: 'Garamond', label: 'Garamond (Elegant)' },
]

type Props = {
  resumeId: string
  currentTemplateId: string | null
  onTemplateChange: (templateId: string) => void
}

export function TemplateCustomizer({ currentTemplateId, onTemplateChange }: Props) {
  const { customization, setCustomization } = useResumeStore()
  const { data: templates, isLoading } = useTemplates()

  const byCategory = templates?.reduce<Record<string, typeof templates>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Template selection */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Template</Label>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : (
          Object.entries(byCategory ?? {}).map(([cat, catTemplates]) => (
            <div key={cat}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {TEMPLATE_CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {catTemplates.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onTemplateChange(template.id)}
                    className={cn(
                      'relative rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50',
                      currentTemplateId === template.id ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <p className="text-xs font-medium truncate">{template.name}</p>
                    {template.premium && (
                      <Badge variant="warning" className="absolute top-1 right-1 text-[10px] px-1 py-0">Pro</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Typography */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Typography</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Font Family</Label>
            <Select value={customization.font_family} onValueChange={v => setCustomization({ font_family: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Font Size (pt)</Label>
            <Input type="number" min="8" max="14" step="0.5" value={customization.font_size} onChange={e => setCustomization({ font_size: Number(e.target.value) })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Line Height: {customization.line_height}</Label>
          <input type="range" min="1.2" max="2.0" step="0.1" value={customization.line_height} onChange={e => setCustomization({ line_height: Number(e.target.value) })} className="w-full" />
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Colors</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Primary Color</Label>
            <div className="flex gap-2">
              <input type="color" value={customization.primary_color} onChange={e => setCustomization({ primary_color: e.target.value })} className="h-9 w-10 rounded border border-border cursor-pointer" />
              <Input value={customization.primary_color} onChange={e => setCustomization({ primary_color: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Accent Color</Label>
            <div className="flex gap-2">
              <input type="color" value={customization.secondary_color} onChange={e => setCustomization({ secondary_color: e.target.value })} className="h-9 w-10 rounded border border-border cursor-pointer" />
              <Input value={customization.secondary_color} onChange={e => setCustomization({ secondary_color: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Layout</Label>
        <div className="space-y-1">
          <Label className="text-xs">Page Margins (px): {customization.margins}</Label>
          <input type="range" min="16" max="80" step="4" value={customization.margins} onChange={e => setCustomization({ margins: Number(e.target.value) })} className="w-full" />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Profile Photo</Label>
          <Switch checked={customization.show_photo} onCheckedChange={v => setCustomization({ show_photo: v })} />
        </div>
      </div>
    </div>
  )
}
