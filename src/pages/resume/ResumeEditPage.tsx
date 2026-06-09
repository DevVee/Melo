import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Eye, Download, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useResume, useUpdateResume } from '@/features/resume/hooks/useResumes'
import { useSections } from '@/features/resume/hooks/useSections'
import { SectionEditor } from '@/features/resume/components/SectionEditor'
import { SectionManager } from '@/features/resume/components/SectionManager'
import { ResumePreviewPanel } from '@/features/resume/components/ResumePreviewPanel'
import { TemplateCustomizer } from '@/features/templates/components/TemplateCustomizer'
import { ROUTES } from '@/constants'

export default function ResumeEditPage() {
  const { id } = useParams<{ id: string }>()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const { data: resume, isLoading: resumeLoading } = useResume(id!)
  const { data: sections, isLoading: sectionsLoading } = useSections(id!)
  const { mutate: updateResume } = useUpdateResume()

  const isLoading = resumeLoading || sectionsLoading

  if (isLoading) {
    return (
      <div className="flex h-full gap-6">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-64" />
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
        <Skeleton className="hidden lg:block w-96 h-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.RESUMES}>
            <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="font-semibold truncate max-w-xs">{resume?.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Preview'}</span>
          </Button>
          <Link to={ROUTES.RESUME_PREVIEW(id!)}>
            <Button size="sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left panel — Section editor */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="design">
                <Settings2 className="h-3.5 w-3.5" />
                Design
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {sections?.filter(s => s.is_visible).map((section) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  isActive={activeSection === section.id}
                  onActivate={() => setActiveSection(section.id === activeSection ? null : section.id)}
                />
              ))}
            </TabsContent>

            <TabsContent value="sections">
              <SectionManager
                sections={sections ?? []}
                resumeId={id!}
              />
            </TabsContent>

            <TabsContent value="design">
              <TemplateCustomizer
                resumeId={id!}
                currentTemplateId={resume?.template_id ?? null}
                onTemplateChange={(templateId) => updateResume({ id: id!, template_id: templateId })}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel — Live preview (desktop) */}
        {showPreview && (
          <div className="hidden lg:flex w-105 shrink-0 flex-col">
            <p className="text-xs font-medium text-muted-foreground mb-2">LIVE PREVIEW</p>
            <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-white shadow-sm">
              <ResumePreviewPanel
                sections={sections ?? []}
                templateId={resume?.template_id ?? null}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
