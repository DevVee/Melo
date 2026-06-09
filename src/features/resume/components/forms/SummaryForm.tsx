import { Sparkles, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useBuilderStore } from '@/store/builder.store'
import { useGenerateSummary } from '@/features/resume/hooks/useAI'

export function SummaryForm() {
  const personal    = useBuilderStore(s => s.personal)
  const experience  = useBuilderStore(s => s.experience)
  const education   = useBuilderStore(s => s.education)
  const update      = useBuilderStore(s => s.updatePersonal)

  const { mutate: generate, isPending } = useGenerateSummary()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Professional Summary</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => generate({ personal, experience, education }, {
            onSuccess: (text) => update({ summary: text }),
          })}
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Sparkles className="h-3.5 w-3.5" />}
          AI Generate
        </Button>
      </div>

      <Textarea
        value={personal.summary}
        onChange={e => update({ summary: e.target.value })}
        placeholder="Experienced Software Engineer with 5+ years building scalable web applications…"
        className="min-h-32 resize-y"
        maxLength={600}
      />
      <p className="text-right text-xs text-muted-foreground">{personal.summary.length}/600</p>
    </div>
  )
}
