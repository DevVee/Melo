import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SECTION_LABELS } from '@/constants'
import { PersonalInfoForm } from './forms/PersonalInfoForm'
import { SummaryForm } from './forms/SummaryForm'
import { WorkExperienceForm } from './forms/WorkExperienceForm'
import { EducationForm } from './forms/EducationForm'
import { SkillsForm } from './forms/SkillsForm'
import { ProjectsForm } from './forms/ProjectsForm'
import { CertificationsForm } from './forms/CertificationsForm'
import { GenericSectionForm } from './forms/GenericSectionForm'

type Props = {
  section: {
    id: string
    section_type: string
    content: Record<string, unknown>
    resume_id: string
  }
  isActive: boolean
  onActivate: () => void
}

const SECTION_FORMS: Record<string, React.ComponentType<{ section: Props['section'] }>> = {
  personal_info:        PersonalInfoForm,
  professional_summary: SummaryForm,
  career_objective:     SummaryForm,
  work_experience:      WorkExperienceForm,
  education:            EducationForm,
  skills:               SkillsForm,
  projects:             ProjectsForm,
  certifications:       CertificationsForm,
}

export function SectionEditor({ section, isActive, onActivate }: Props) {
  const label = SECTION_LABELS[section.section_type] ?? section.section_type
  const Form = SECTION_FORMS[section.section_type] ?? GenericSectionForm

  return (
    <Card className={cn('transition-all', isActive && 'ring-2 ring-primary/30')}>
      {/* Header — click to expand/collapse */}
      <CardHeader
        className="flex flex-row items-center justify-between p-4 cursor-pointer select-none"
        onClick={onActivate}
      >
        <h3 className="font-semibold text-sm">{label}</h3>
        <div className="flex items-center gap-2">
          {isActive && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="AI assist">
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          )}
          {isActive ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {/* Body */}
      {isActive && (
        <CardContent className="pt-0 pb-4 px-4">
          <Form section={section} />
        </CardContent>
      )}
    </Card>
  )
}
