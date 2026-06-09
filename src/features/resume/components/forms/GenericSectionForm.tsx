import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useUpdateSection } from '@/features/resume/hooks/useSections'
import { SECTION_LABELS } from '@/constants'

type Props = { section: { id: string; content: Record<string, unknown>; section_type: string } }

export function GenericSectionForm({ section }: Props) {
  const { mutate: updateSection } = useUpdateSection()
  const [text, setText] = useState((section.content as { text?: string }).text ?? '')
  const label = SECTION_LABELS[section.section_type] ?? 'Content'

  const save = useDebouncedCallback((val: string) => {
    updateSection({ id: section.id, content: { text: val } })
  }, 800)

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Textarea
        value={text}
        onChange={e => { setText(e.target.value); save(e.target.value) }}
        placeholder={`Enter your ${label.toLowerCase()}…`}
        className="min-h-32 resize-y"
      />
    </div>
  )
}
