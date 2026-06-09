import { useState } from 'react'
import { BarChart2, Loader2, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useResumes } from '@/features/resume/hooks/useResumes'
import { useSections } from '@/features/resume/hooks/useSections'
import { useAtsOptimize } from '@/features/resume/hooks/useAI'
import { getAtsScoreBand } from '@/constants'
import { cn } from '@/lib/utils'
import type { WorkExperience, Education, Skill } from '@/types'

function buildResumeText(sections: { section_type: string; content: Record<string, unknown> }[]) {
  const lines: string[] = []
  const get = (t: string) => sections.find(s => s.section_type === t)?.content ?? {}

  const p = get('personal_info') as Record<string, string>
  if (p.first_name) lines.push(`${p.first_name} ${p.last_name}`, p.professional_title ?? '', p.email ?? '')

  const summary = (get('professional_summary') as { text?: string }).text
  if (summary) lines.push('\nSUMMARY\n' + summary)

  const exp = (get('work_experience') as { entries?: WorkExperience[] }).entries ?? []
  if (exp.length) {
    lines.push('\nEXPERIENCE')
    exp.forEach(e => {
      lines.push(`${e.position} at ${e.company_name}`)
      e.responsibilities.forEach(r => lines.push(`- ${r}`))
      if (e.technologies?.length) lines.push('Technologies: ' + e.technologies.join(', '))
    })
  }

  const edu = (get('education') as { entries?: Education[] }).entries ?? []
  if (edu.length) {
    lines.push('\nEDUCATION')
    edu.forEach(e => lines.push(`${e.degree} in ${e.program} from ${e.school}`))
  }

  const skills = (get('skills') as { items?: Skill[] }).items ?? []
  if (skills.length) lines.push('\nSKILLS\n' + skills.map(s => s.name).join(', '))

  return lines.filter(Boolean).join('\n')
}

export default function AtsReportsPage() {
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<{ matchScore: number; missingKeywords: string[]; missingSkills: string[]; recommendations: string[] } | null>(null)

  const { data: resumes } = useResumes()
  const { data: sections } = useSections(selectedResumeId)
  const { mutate: analyze, isPending, error } = useAtsOptimize()

  function handleAnalyze() {
    if (!sections || !jobDescription.trim()) return
    const resumeText = buildResumeText(sections)
    analyze({ resumeText, jobDescription }, { onSuccess: setResult })
  }

  const band = result ? getAtsScoreBand(result.matchScore) : null

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ATS Analyzer</h1>
        <p className="text-sm text-muted-foreground mt-1">Analyze your resume against a job description and get an ATS score.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <Label>Select Resume</Label>
            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
              <SelectTrigger><SelectValue placeholder="Choose a resume…" /></SelectTrigger>
              <SelectContent>
                {resumes?.map(r => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Job Description</Label>
            <Textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              className="min-h-36"
            />
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{(error as Error).message}</AlertDescription></Alert>}

          <Button
            className="w-full"
            disabled={!selectedResumeId || !jobDescription.trim() || isPending}
            onClick={handleAnalyze}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <BarChart2 className="h-4 w-4" />}
            Analyze Resume
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ATS Match Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-3">
                <span className={cn('text-5xl font-bold', band?.color)}>{result.matchScore}</span>
                <span className="text-lg text-muted-foreground mb-1">/100</span>
                <Badge variant="secondary" className="mb-1 ml-2">{band?.label}</Badge>
              </div>
              <Progress value={result.matchScore} className="h-3" />
            </CardContent>
          </Card>

          {/* Missing Keywords */}
          {result.missingKeywords.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /> Missing Keywords</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map(kw => <Badge key={kw} variant="outline" className="text-destructive border-destructive/40">{kw}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing Skills */}
          {result.missingSkills.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-orange-500" /> Missing Skills</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map(s => <Badge key={s} variant="warning">{s}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-500" /> Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
