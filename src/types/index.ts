export type * from './database'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

// ─── Resume Content Types ─────────────────────────────────────────────────────

export type PersonalInfo = {
  first_name: string
  middle_name?: string
  last_name: string
  professional_title?: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  photo_url?: string
}

export type WorkExperience = {
  id: string
  company_name: string
  position: string
  location?: string
  employment_type?: import('./database').EmploymentType
  start_date: string
  end_date?: string
  is_current: boolean
  responsibilities: string[]
  achievements: string[]
  technologies: string[]
}

export type Education = {
  id: string
  school: string
  degree: string
  program: string
  major?: string
  start_year: number
  end_year?: number
  gpa?: number
  honors?: string
  achievements?: string[]
}

export type Skill = {
  id: string
  name: string
  /** Free-form category label — e.g. "Frontend Development", "Backend Development", "Soft Skills", etc.
   *  Legacy short keys (technical | soft | language | framework | platform | tool) are still supported. */
  category: string
  level?: import('./database').SkillLevel
}

export type Project = {
  id: string
  name: string
  description: string
  technologies: string[]
  role?: string
  start_date?: string
  end_date?: string
  project_url?: string
  github_url?: string
}

export type Certification = {
  id: string
  name: string
  issuing_organization: string
  issue_date: string
  expiration_date?: string
  credential_url?: string
}

// ─── Template Customization ───────────────────────────────────────────────────

export type TemplateCustomization = {
  font_family: string
  font_size: number
  primary_color: string
  secondary_color: string
  margins: number
  line_height: number
  show_photo: boolean
}

// ─── UI / Utility ─────────────────────────────────────────────────────────────

export type NavItem = {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

export type ApiError = {
  message: string
  code?: string
}
