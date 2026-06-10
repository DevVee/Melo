import type { PersonalInfo, WorkExperience, Education, Skill, Project, Certification } from '@/types'

export type ResumeData = {
  personal_info: PersonalInfo
  professional_summary?: string
  career_objective?: string
  work_experience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  /** Personal strengths — separate section from skills */
  strengths?: { name: string }[]
  projects: Project[]
  certifications: Certification[]
  /** Hobbies / Interests — single AI-generated sentence */
  interests?: string
  sections: { section_type: string; sort_order: number; is_visible: boolean }[]
}
