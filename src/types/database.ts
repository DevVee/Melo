/**
 * Supabase database types — mirrors the PostgreSQL schema.
 * Run `npx supabase gen types typescript` to auto-regenerate after schema changes.
 */

// ─── Domain Types (defined before Database to avoid forward-reference issues) ─

export type SectionType =
  | 'personal_info'
  | 'professional_summary'
  | 'career_objective'
  | 'work_experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'languages'
  | 'references'
  | 'volunteer_experience'
  | 'trainings'
  | 'seminars'
  | 'organizations'
  | 'publications'
  | 'research'
  | 'achievements'
  | 'interests'
  | 'custom'

export type TemplateCategory =
  | 'ats'
  | 'modern'
  | 'corporate'
  | 'creative'
  | 'student'
  | 'technology'

export type AtsReport = {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  warnings: string[]
  keyword_score: number
  readability_score: number
  formatting_score: number
  completeness_score: number
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
export type ResumeStatus = 'draft' | 'published' | 'archived'

// ─── Database Schema ──────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          title: string
          template_id: string | null
          status: ResumeStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          template_id?: string | null
          status?: ResumeStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          template_id?: string | null
          status?: ResumeStatus
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'resumes_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'templates'
            referencedColumns: ['id']
          }
        ]
      }
      resume_sections: {
        Row: {
          id: string
          resume_id: string
          section_type: SectionType
          sort_order: number
          content: Record<string, unknown>
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          section_type: SectionType
          sort_order: number
          content?: Record<string, unknown>
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          section_type?: SectionType
          sort_order?: number
          content?: Record<string, unknown>
          is_visible?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'resume_sections_resume_id_fkey'
            columns: ['resume_id']
            isOneToOne: false
            referencedRelation: 'resumes'
            referencedColumns: ['id']
          }
        ]
      }
      templates: {
        Row: {
          id: string
          name: string
          category: TemplateCategory
          thumbnail: string | null
          premium: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: TemplateCategory
          thumbnail?: string | null
          premium?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: TemplateCategory
          thumbnail?: string | null
          premium?: boolean
        }
        Relationships: []
      }
      ats_reports: {
        Row: {
          id: string
          resume_id: string
          score: number
          report: AtsReport
          created_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          score: number
          report: AtsReport
          created_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          score?: number
          report?: AtsReport
        }
        Relationships: [
          {
            foreignKeyName: 'ats_reports_resume_id_fkey'
            columns: ['resume_id']
            isOneToOne: false
            referencedRelation: 'resumes'
            referencedColumns: ['id']
          }
        ]
      }
      cover_letters: {
        Row: {
          id: string
          resume_id: string
          content: string
          job_title: string | null
          company_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          content: string
          job_title?: string | null
          company_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          content?: string
          job_title?: string | null
          company_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cover_letters_resume_id_fkey'
            columns: ['resume_id']
            isOneToOne: false
            referencedRelation: 'resumes'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
