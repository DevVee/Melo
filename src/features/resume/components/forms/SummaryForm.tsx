import { useState } from 'react'
import { Sparkles, Loader2, Check, RefreshCw } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useBuilderStore } from '@/store/builder.store'
import { useGenerateSummary, useGenerateProfessionalTitle } from '@/features/resume/hooks/useAI'

export function SummaryForm() {
  const personal    = useBuilderStore(s => s.personal)
  const experience  = useBuilderStore(s => s.experience)
  const education   = useBuilderStore(s => s.education)
  const update      = useBuilderStore(s => s.updatePersonal)

  const [titleGenerated, setTitleGenerated] = useState(false)

  const { mutate: generateSummary, isPending: genSummary } = useGenerateSummary()
  const { mutate: generateTitle,   isPending: genTitle   } = useGenerateProfessionalTitle()

  const isPending = genSummary || genTitle

  function handleGenerate() {
    // Generate both summary and professional title in parallel
    generateSummary({ personal, experience, education }, {
      onSuccess: (text) => update({ summary: text }),
    })
    generateTitle({ experience, education }, {
      onSuccess: (title) => {
        update({ professionalTitle: title })
        setTitleGenerated(true)
        setTimeout(() => setTitleGenerated(false), 3000)
      },
    })
  }

  return (
    <div className="space-y-4">

      {/* Generated title badge */}
      {personal.professionalTitle && (
        <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 border transition-all ${
          titleGenerated
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          {titleGenerated
            ? <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            : <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {titleGenerated ? 'Professional title generated!' : 'Your professional title'}
            </p>
            <p className="text-sm font-semibold text-gray-800 truncate">{personal.professionalTitle}</p>
          </div>
          <button
            onClick={() => generateTitle({ experience, education }, {
              onSuccess: (title) => { update({ professionalTitle: title }); setTitleGenerated(true); setTimeout(() => setTitleGenerated(false), 3000) },
            })}
            disabled={genTitle}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 transition-colors"
            title="Regenerate title"
          >
            {genTitle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-gray-800">Professional Summary</Label>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={handleGenerate}
            className="text-white text-xs gap-1.5 px-3"
            style={{ background: 'var(--melo-gradient)' }}
          >
            {isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />}
            {isPending ? 'Generating…' : personal.summary ? 'Regenerate' : 'AI Generate'}
          </Button>
        </div>

        <Textarea
          value={personal.summary}
          onChange={e => update({ summary: e.target.value })}
          placeholder="AI will generate a sharp 2-sentence professional summary — click AI Generate above, or write your own…"
          className="min-h-32 resize-y text-sm"
          maxLength={600}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {personal.summary
              ? 'Edit freely — click Regenerate for a fresh version'
              : 'AI reads your full profile: job target, experience, education, and skills'}
          </p>
          <p className="text-xs text-gray-400">{personal.summary.length}/600</p>
        </div>
      </div>
    </div>
  )
}
