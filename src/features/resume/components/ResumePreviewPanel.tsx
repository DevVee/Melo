import { useResumeStore } from '@/store/resume.store'
import { HarvardTemplate } from '@/features/templates/components/templates/HarvardTemplate'
import { MinimalTemplate } from '@/features/templates/components/templates/MinimalTemplate'
import { ModernTemplate } from '@/features/templates/components/templates/ModernTemplate'
import { ExecutiveTemplate } from '@/features/templates/components/templates/ExecutiveTemplate'
import type { ResumeData } from '@/features/templates/types'

type Section = {
  section_type: string
  content: Record<string, unknown>
  sort_order: number
  is_visible: boolean
}

type Props = {
  sections: Section[]
  templateId?: string | null
  templateName?: string
}

function sectionsToResumeData(sections: Section[]): ResumeData {
  const sorted = [...sections].filter(s => s.is_visible).sort((a, b) => a.sort_order - b.sort_order)
  const get = (type: string) => sorted.find(s => s.section_type === type)?.content ?? {}

  return {
    personal_info: get('personal_info') as ResumeData['personal_info'],
    professional_summary: (get('professional_summary') as { text?: string }).text,
    career_objective: (get('career_objective') as { text?: string }).text,
    work_experience: (get('work_experience') as { entries?: ResumeData['work_experience'] }).entries ?? [],
    education: (get('education') as { entries?: ResumeData['education'] }).entries ?? [],
    skills: (get('skills') as { items?: ResumeData['skills'] }).items ?? [],
    projects: (get('projects') as { entries?: ResumeData['projects'] }).entries ?? [],
    certifications: (get('certifications') as { entries?: ResumeData['certifications'] }).entries ?? [],
    sections: sorted,
  }
}

// Template registry — maps template name slug → component
// Keys must match TEMPLATES[].name.toLowerCase() from BuilderPage
const TEMPLATE_MAP: Record<string, React.ComponentType<{ data: ResumeData }>> = {
  // Academic variants
  harvard:          HarvardTemplate,
  stanford:         HarvardTemplate,
  oxford:           HarvardTemplate,
  mit:              HarvardTemplate,
  academic:         HarvardTemplate,
  // Minimal variants
  minimal:          MinimalTemplate,
  clean:            MinimalTemplate,
  internship:       MinimalTemplate,
  'fresh graduate': MinimalTemplate,
  'fresh grad':     MinimalTemplate,
  // Executive/corporate variants
  executive:        ExecutiveTemplate,
  business:         ExecutiveTemplate,
  finance:          ExecutiveTemplate,
  // Modern variants (all others)
  modern:           ModernTemplate,
  elegant:          ModernTemplate,
  professional:     ModernTemplate,
  marketing:        ModernTemplate,
  multimedia:       ModernTemplate,
  designer:         ModernTemplate,
  engineer:         ModernTemplate,
  'software dev':   ModernTemplate,
  'data analyst':   ModernTemplate,
}

export function ResumePreviewPanel({ sections, templateName }: Props) {
  const { customization } = useResumeStore()
  const data = sectionsToResumeData(sections)

  const slug = (templateName ?? 'minimal').toLowerCase()
  const Template = TEMPLATE_MAP[slug] ?? MinimalTemplate

  return (
    <div
      style={{
        fontFamily: customization.font_family,
        fontSize: `${customization.font_size}pt`,
        lineHeight: customization.line_height,
        '--resume-primary': customization.primary_color,
        '--resume-secondary': customization.secondary_color,
        '--resume-margin': `${customization.margins}px`,
      } as React.CSSProperties}
      className="min-h-full"
    >
      <Template data={data} />
    </div>
  )
}
