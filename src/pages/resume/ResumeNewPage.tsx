import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, BookOpen, MessageSquare, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateResume } from '@/features/resume/hooks/useResumes'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'

type Mode = 'quick' | 'guided' | 'ai'

const MODES: { id: Mode; icon: typeof Zap; label: string; desc: string; badge?: string }[] = [
  {
    id: 'quick',
    icon: Zap,
    label: 'Quick Builder',
    desc: 'Answer a few questions and AI will generate your complete resume draft in seconds.',
    badge: 'Fastest',
  },
  {
    id: 'guided',
    icon: BookOpen,
    label: 'Guided Builder',
    desc: 'Step-by-step wizard with examples and suggestions for each section.',
    badge: 'Recommended',
  },
  {
    id: 'ai',
    icon: MessageSquare,
    label: 'AI Chat Builder',
    desc: 'Have a conversation with AI and it will build your resume from your answers.',
    badge: 'Smart',
  },
]

export default function ResumeNewPage() {
  const [selected, setSelected] = useState<Mode>('guided')
  const [title, setTitle] = useState('')
  const navigate = useNavigate()
  const { mutate: createResume, isPending } = useCreateResume()

  function handleCreate() {
    const resumeTitle = title.trim() || 'My Resume'
    createResume(resumeTitle, {
      onSuccess: (resume) => navigate(ROUTES.RESUME_EDIT(resume.id) + `?mode=${selected}`),
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a New Resume</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose how you'd like to build your resume.</p>
      </div>

      {/* Resume title */}
      <div className="space-y-2">
        <Label htmlFor="title">Resume Title</Label>
        <Input
          id="title"
          placeholder="e.g. Software Developer Resume"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">This is for your reference only — not shown on the resume.</p>
      </div>

      {/* Mode selection */}
      <div className="space-y-3">
        <Label>Build Mode</Label>
        <div className="grid gap-3">
          {MODES.map(({ id, icon: Icon, label, desc, badge }) => (
            <Card
              key={id}
              className={cn(
                'cursor-pointer transition-all border-2',
                selected === id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
              onClick={() => setSelected(id)}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', selected === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{label}</p>
                    {badge && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{badge}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <div className={cn('mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2', selected === id ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                  {selected === id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button onClick={handleCreate} className="w-full" size="lg" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : null}
        Start Building
      </Button>
    </div>
  )
}
