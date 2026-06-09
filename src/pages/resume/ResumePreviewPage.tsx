import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Download, Loader2, FileText, Image, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useResume } from '@/features/resume/hooks/useResumes'
import { useSections } from '@/features/resume/hooks/useSections'
import { ResumePreviewPanel } from '@/features/resume/components/ResumePreviewPanel'
import { exportToPDF, exportToPNG, exportToJPEG, exportToDOCX } from '@/lib/export'
import { ROUTES } from '@/constants'
import type { WorkExperience, Education, Skill } from '@/types'

export default function ResumePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const previewRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const { data: resume, isLoading: rLoading } = useResume(id!)
  const { data: sections, isLoading: sLoading } = useSections(id!)

  async function handleExport(format: 'pdf' | 'png' | 'jpg' | 'docx') {
    if (!previewRef.current) return
    setExporting(true)
    try {
      const filename = `${resume?.title ?? 'resume'}.${format}`
      if (format === 'pdf')  await exportToPDF(previewRef.current, filename)
      if (format === 'png')  await exportToPNG(previewRef.current, filename)
      if (format === 'jpg')  await exportToJPEG(previewRef.current, filename)
      if (format === 'docx') {
        // Build data structure from sections
        const get = (type: string) => sections?.find(s => s.section_type === type)?.content ?? {}
        const p = get('personal_info') as Record<string, string>
        const exp = (get('work_experience') as { entries?: WorkExperience[] }).entries ?? []
        const edu = (get('education') as { entries?: Education[] }).entries ?? []
        const skills = (get('skills') as { items?: Skill[] }).items ?? []

        await exportToDOCX({
          name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
          title: p.professional_title,
          email: p.email,
          phone: p.phone,
          location: p.city ? `${p.city}, ${p.country ?? ''}` : undefined,
          summary: (get('professional_summary') as { text?: string }).text,
          experience: exp.map(e => ({
            position: e.position,
            company: e.company_name,
            dates: `${e.start_date} – ${e.is_current ? 'Present' : (e.end_date ?? '')}`,
            bullets: e.responsibilities,
          })),
          education: edu.map(e => ({
            school: e.school,
            degree: `${e.degree} ${e.program}`.trim(),
            years: `${e.start_year} – ${e.end_year ?? 'Present'}`,
          })),
          skills: skills.map(s => s.name),
        }, filename)
      }
    } finally {
      setExporting(false)
    }
  }

  if (rLoading || sLoading) {
    return (
      <div className="flex h-full gap-6">
        <div className="flex-1"><Skeleton className="h-full rounded-xl" /></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.RESUME_EDIT(id!)}>
            <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="font-semibold">{resume?.title}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={exporting}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download className="h-4 w-4" />}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4" /> Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('docx')}>
              <FileDown className="h-4 w-4" /> Export as DOCX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('png')}>
              <Image className="h-4 w-4" /> Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('jpg')}>
              <Image className="h-4 w-4" /> Export as JPEG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto flex justify-center bg-muted/30 rounded-xl p-6">
        <div ref={previewRef} className="w-full max-w-3xl bg-white shadow-lg rounded">
          <ResumePreviewPanel sections={sections ?? []} templateId={resume?.template_id ?? null} />
        </div>
      </div>
    </div>
  )
}
