import { useState } from 'react'
import { FileText, Loader2, Copy, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useResumes } from '@/features/resume/hooks/useResumes'
import { useSections } from '@/features/resume/hooks/useSections'
import { useGenerateCoverLetter } from '@/features/resume/hooks/useAI'
import type { WorkExperience, Skill } from '@/types'

function buildResumeHighlights(sections: { section_type: string; content: Record<string, unknown> }[]) {
  const get = (t: string) => sections.find(s => s.section_type === t)?.content ?? {}
  const exp = (get('work_experience') as { entries?: WorkExperience[] }).entries ?? []
  const skills = (get('skills') as { items?: Skill[] }).items ?? []
  const summary = (get('professional_summary') as { text?: string }).text

  return [
    summary && `Summary: ${summary}`,
    exp.length && `Experience: ${exp.slice(0, 2).map(e => `${e.position} at ${e.company_name}`).join(', ')}`,
    skills.length && `Skills: ${skills.slice(0, 10).map(s => s.name).join(', ')}`,
  ].filter(Boolean).join('\n')
}

export default function CoverLettersPage() {
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [generated, setGenerated] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: resumes } = useResumes()
  const { data: sections } = useSections(selectedResumeId)
  const { mutate: generate, isPending, error } = useGenerateCoverLetter()

  function handleGenerate() {
    if (!sections) return
    const resumeText = buildResumeHighlights(sections)
    generate(
      { resumeText, jobTitle, companyName, jobDescription: jobDescription || undefined },
      { onSuccess: setGenerated }
    )
  }

  function handleCopy() {
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([generated], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover-letter-${companyName || 'company'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cover Letter Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered cover letters tailored to the job and company.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <Label>Resume</Label>
            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
              <SelectTrigger><SelectValue placeholder="Select a resume…" /></SelectTrigger>
              <SelectContent>{resumes?.map(r => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Job Title *</Label>
              <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Software Engineer" />
            </div>
            <div className="space-y-1">
              <Label>Company Name *</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Google" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Job Description <span className="text-muted-foreground">(optional, improves quality)</span></Label>
            <Textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description…" className="min-h-24" />
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{(error as Error).message}</AlertDescription></Alert>}

          <Button
            className="w-full"
            disabled={!selectedResumeId || !jobTitle || !companyName || isPending}
            onClick={handleGenerate}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <FileText className="h-4 w-4" />}
            Generate Cover Letter
          </Button>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Generated Cover Letter</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
            <Textarea
              value={generated}
              onChange={e => setGenerated(e.target.value)}
              className="min-h-80 resize-y font-sans text-sm leading-relaxed"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
