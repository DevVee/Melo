export const APP_NAME = 'Melo'
export const APP_TAGLINE = 'Create professional, ATS-friendly resumes with AI guidance.'
export const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'

// ─── Routes ──────────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: '/',
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  // App
  DASHBOARD: '/dashboard',
  RESUMES: '/resumes',
  RESUME_NEW: '/resumes/new',
  RESUME_EDIT: (id: string) => `/resumes/${id}/edit`,
  RESUME_PREVIEW: (id: string) => `/resumes/${id}/preview`,
  TEMPLATES: '/templates',
  ATS_REPORTS: '/ats-reports',
  ATS_REPORT: (id: string) => `/ats-reports/${id}`,
  COVER_LETTERS: '/cover-letters',
  PROFILE: '/profile',
  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_TEMPLATES: '/admin/templates',
  ADMIN_ANALYTICS: '/admin/analytics',
} as const

// ─── Resume Sections ─────────────────────────────────────────────────────────

export const SECTION_LABELS: Record<string, string> = {
  personal_info: 'Personal Information',
  professional_summary: 'Professional Summary',
  career_objective: 'Career Objective',
  work_experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards & Honors',
  languages: 'Languages',
  references: 'References',
  volunteer_experience: 'Volunteer Experience',
  trainings: 'Trainings',
  seminars: 'Seminars & Workshops',
  organizations: 'Organizations',
  publications: 'Publications',
  research: 'Research',
  achievements: 'Achievements',
  interests: 'Interests & Hobbies',
  custom: 'Custom Section',
}

// ─── Template Categories ──────────────────────────────────────────────────────

export const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  ats: 'ATS Friendly',
  modern: 'Modern',
  corporate: 'Corporate',
  creative: 'Creative',
  student: 'Student',
  technology: 'Technology',
}

// ─── Skill Levels ─────────────────────────────────────────────────────────────

export const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
}

// ─── Employment Types ─────────────────────────────────────────────────────────

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
}

// ─── ATS Score Bands ──────────────────────────────────────────────────────────

export const ATS_SCORE_BANDS = [
  { min: 85, label: 'Excellent', color: 'text-green-600' },
  { min: 70, label: 'Good', color: 'text-blue-600' },
  { min: 50, label: 'Fair', color: 'text-yellow-600' },
  { min: 0, label: 'Needs Work', color: 'text-red-600' },
] as const

export function getAtsScoreBand(score: number) {
  return ATS_SCORE_BANDS.find((band) => score >= band.min) ?? ATS_SCORE_BANDS[ATS_SCORE_BANDS.length - 1]
}
