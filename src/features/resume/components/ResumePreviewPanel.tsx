import { useResumeStore } from '@/store/resume.store'
import { HarvardTemplate }      from '@/features/templates/components/templates/HarvardTemplate'
import { MinimalTemplate }      from '@/features/templates/components/templates/MinimalTemplate'
import { ModernTemplate }       from '@/features/templates/components/templates/ModernTemplate'
import { ExecutiveTemplate }    from '@/features/templates/components/templates/ExecutiveTemplate'
import { FreshGradTemplate }    from '@/features/templates/components/templates/FreshGradTemplate'
import { TechTemplate }         from '@/features/templates/components/templates/TechTemplate'
import { ClassicTemplate }      from '@/features/templates/components/templates/ClassicTemplate'
import { SidebarRightTemplate } from '@/features/templates/components/templates/SidebarRightTemplate'
import { SplitTemplate }        from '@/features/templates/components/templates/SplitTemplate'
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
  /** Override the store's customization colors (used in the builder flow) */
  primaryColor?: string
  secondaryColor?: string
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
    // Personal Strengths — own section
    strengths: (get('strengths') as { items?: ResumeData['strengths'] }).items ?? [],
    projects: (get('projects') as { entries?: ResumeData['projects'] }).entries ?? [],
    certifications: (get('certifications') as { entries?: ResumeData['certifications'] }).entries ?? [],
    // Hobbies / Interests — single sentence
    interests: (get('interests') as { text?: string }).text,
    sections: sorted,
  }
}

// Template registry — maps template name slug → component
// Keys must match TEMPLATES[].name.toLowerCase() from BuilderPage
const TEMPLATE_MAP: Record<string, React.ComponentType<{ data: ResumeData }>> = {
  // ── Academic ──
  harvard:              HarvardTemplate,
  stanford:             HarvardTemplate,
  oxford:               HarvardTemplate,
  mit:                  HarvardTemplate,
  academic:             HarvardTemplate,
  // ── Minimal / Clean ──
  minimal:              MinimalTemplate,
  clean:                MinimalTemplate,
  // ── Classic (photo header + ruled sections + skills as "Cat: items") ──
  classic:              ClassicTemplate,
  professional:         ClassicTemplate,   // ← reassigned from Modern
  // ── Modern dark-sidebar ──
  modern:               ModernTemplate,
  elegant:              ModernTemplate,
  multimedia:           ModernTemplate,
  // ── Sidebar-Right (sidebar on right, different from Modern) ──
  designer:             SidebarRightTemplate,
  'sidebar-right':      SidebarRightTemplate,
  'sidebar right':      SidebarRightTemplate,
  // ── Split (balanced 50/50 two-column) ──
  marketing:            SplitTemplate,
  split:                SplitTemplate,
  'two-column':         SplitTemplate,
  'two column':         SplitTemplate,
  // ── Executive / corporate ──
  executive:            ExecutiveTemplate,
  business:             ExecutiveTemplate,
  finance:              ExecutiveTemplate,
  // ── Fresh Grad / Entry-level ──
  'fresh graduate':     FreshGradTemplate,
  'fresh grad':         FreshGradTemplate,
  'fresh-grad':         FreshGradTemplate,
  internship:           FreshGradTemplate,
  // ── Tech / Developer ──
  'software dev':       TechTemplate,
  'software-dev':       TechTemplate,
  'data analyst':       TechTemplate,
  'data-analyst':       TechTemplate,
  engineer:             TechTemplate,
}

export function ResumePreviewPanel({ sections, templateName, primaryColor, secondaryColor }: Props) {
  const { customization } = useResumeStore()
  const data = sectionsToResumeData(sections)

  const slug = (templateName ?? 'minimal').toLowerCase()
  const Template = TEMPLATE_MAP[slug] ?? MinimalTemplate

  // Props override the store so the builder flow can pass per-template colors
  const primary   = primaryColor   ?? customization.primary_color
  const secondary = secondaryColor ?? customization.secondary_color

  return (
    <div
      style={{
        fontFamily: customization.font_family,
        fontSize: `${customization.font_size}pt`,
        lineHeight: customization.line_height,
        '--resume-primary': primary,
        '--resume-secondary': secondary,
        '--resume-margin': `${customization.margins}px`,
        // Explicit height so templates can use height:100% to fill the A4 canvas
        height: '100%',
        minHeight: '100%',
      } as React.CSSProperties}
    >
      <Template data={data} />
    </div>
  )
}
