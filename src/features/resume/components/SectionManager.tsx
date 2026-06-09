import { useState } from 'react'
import { Eye, EyeOff, GripVertical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateSection, useReorderSections, useAddSection } from '@/features/resume/hooks/useSections'
import { SECTION_LABELS } from '@/constants'
import type { SectionType } from '@/types'
import { cn } from '@/lib/utils'

type Section = {
  id: string
  section_type: string
  sort_order: number
  is_visible: boolean
}

type Props = { sections: Section[]; resumeId: string }

const ALL_SECTION_TYPES = Object.keys(SECTION_LABELS) as SectionType[]

export function SectionManager({ sections, resumeId }: Props) {
  const [newType, setNewType] = useState<SectionType>('achievements')
  const { mutate: updateSection } = useUpdateSection()
  const { mutate: reorder } = useReorderSections()
  const { mutate: addSection, isPending: adding } = useAddSection()

  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  function moveSection(id: string, direction: 'up' | 'down') {
    const idx = sorted.findIndex(s => s.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const updates = sorted.map((s, i) => {
      if (i === idx) return { id: s.id, sort_order: sorted[swapIdx].sort_order }
      if (i === swapIdx) return { id: s.id, sort_order: sorted[idx].sort_order }
      return { id: s.id, sort_order: s.sort_order }
    })
    reorder(updates)
  }

  function toggleVisibility(id: string, is_visible: boolean) {
    updateSection({ id, is_visible: !is_visible })
  }

  const existingTypes = new Set(sections.map(s => s.section_type))
  const availableTypes = ALL_SECTION_TYPES.filter(t => !existingTypes.has(t) || t === 'custom')

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Drag sections to reorder, or toggle visibility.</p>

      {/* Section list */}
      <div className="space-y-2">
        {sorted.map((section, idx) => (
          <div
            key={section.id}
            className={cn('flex items-center gap-3 rounded-lg border border-border p-3', !section.is_visible && 'opacity-50')}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
            <span className="flex-1 text-sm font-medium">{SECTION_LABELS[section.section_type] ?? section.section_type}</span>
            {!section.is_visible && <Badge variant="outline" className="text-xs">Hidden</Badge>}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section.id, 'up')} disabled={idx === 0}>
                <span className="text-xs">↑</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section.id, 'down')} disabled={idx === sorted.length - 1}>
                <span className="text-xs">↓</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(section.id, section.is_visible)}>
                {section.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add section */}
      {availableTypes.length > 0 && (
        <div className="flex gap-2">
          <Select value={newType} onValueChange={v => setNewType(v as SectionType)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map(t => (
                <SelectItem key={t} value={t}>{SECTION_LABELS[t] ?? t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={adding}
            onClick={() => addSection({ resumeId, sectionType: newType, sortOrder: sections.length })}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      )}
    </div>
  )
}
