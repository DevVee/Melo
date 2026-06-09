import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import type { Database } from '@/types/database'
import type { SectionType, ResumeStatus } from '@/types'

// ─── Explicit row types ───────────────────────────────────────────────────────

type ResumeRow = Database['public']['Tables']['resumes']['Row']
type SectionRow = Database['public']['Tables']['resume_sections']['Row']

export type ResumeWithSections = ResumeRow & { resume_sections: SectionRow[] }

const RESUMES_KEY = 'resumes'

// ─── Fetch all resumes for current user ───────────────────────────────────────

export function useResumes() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: [RESUMES_KEY, user?.id],
    queryFn: async (): Promise<ResumeRow[]> => {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ResumeRow[]
    },
    enabled: !!user,
  })
}

// ─── Fetch single resume with all sections ───────────────────────────────────

export function useResume(id: string) {
  return useQuery({
    queryKey: [RESUMES_KEY, id],
    queryFn: async (): Promise<ResumeWithSections> => {
      const { data, error } = await supabase
        .from('resumes')
        .select('*, resume_sections(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as ResumeWithSections
    },
    enabled: !!id,
  })
}

// ─── Create resume ────────────────────────────────────────────────────────────

export function useCreateResume() {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (title: string): Promise<ResumeRow> => {
      const { data, error } = await supabase
        .from('resumes')
        .insert({ user_id: user!.id, title })
        .select()
        .single()
      if (error) throw error

      // Create default sections
      const defaultSections: { resume_id: string; section_type: SectionType; sort_order: number; content: Record<string, unknown>; is_visible?: boolean }[] = [
        { resume_id: data.id, section_type: 'personal_info', sort_order: 0, content: {} },
        { resume_id: data.id, section_type: 'professional_summary', sort_order: 1, content: {} },
        { resume_id: data.id, section_type: 'work_experience', sort_order: 2, content: { entries: [] } },
        { resume_id: data.id, section_type: 'education', sort_order: 3, content: { entries: [] } },
        { resume_id: data.id, section_type: 'skills', sort_order: 4, content: { items: [] } },
        { resume_id: data.id, section_type: 'projects', sort_order: 5, content: { entries: [] }, is_visible: false },
        { resume_id: data.id, section_type: 'certifications', sort_order: 6, content: { entries: [] }, is_visible: false },
      ]
      await supabase.from('resume_sections').insert(defaultSections)
      return data as unknown as ResumeRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [RESUMES_KEY] }),
  })
}

// ─── Update resume title / template ──────────────────────────────────────────

export function useUpdateResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; template_id?: string | null; status?: ResumeStatus }): Promise<ResumeRow> => {
      const { data, error } = await supabase.from('resumes').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as unknown as ResumeRow
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [RESUMES_KEY] })
      qc.invalidateQueries({ queryKey: [RESUMES_KEY, data.id] })
    },
  })
}

// ─── Delete resume ────────────────────────────────────────────────────────────

export function useDeleteResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resumes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [RESUMES_KEY] }),
  })
}

// ─── Duplicate resume ─────────────────────────────────────────────────────────

export function useDuplicateResume() {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (sourceId: string): Promise<ResumeRow> => {
      // Fetch source resume + sections
      const { data: source, error } = await supabase
        .from('resumes')
        .select('*, resume_sections(*)')
        .eq('id', sourceId)
        .single()
      if (error) throw error
      const src = source as unknown as ResumeWithSections

      // Create new resume
      const { data: newResume, error: e2 } = await supabase
        .from('resumes')
        .insert({ user_id: user!.id, title: `${src.title} (Copy)`, template_id: src.template_id })
        .select()
        .single()
      if (e2) throw e2
      const nr = newResume as unknown as ResumeRow

      // Copy sections
      const sections = src.resume_sections.map((sec) => ({
        resume_id: nr.id,
        section_type: sec.section_type,
        sort_order: sec.sort_order,
        content: sec.content,
        is_visible: sec.is_visible,
      }))
      if (sections.length) await supabase.from('resume_sections').insert(sections)
      return nr
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [RESUMES_KEY] }),
  })
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export function useDashboardStats() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const [resumesRes, atsRes, coverRes] = await Promise.all([
        supabase.from('resumes').select('id', { count: 'exact' }).eq('user_id', user!.id),
        supabase.from('ats_reports').select('score').eq('resume_id', user!.id), // simplified — see note
        supabase.from('cover_letters').select('id', { count: 'exact' }).eq('resume_id', user!.id),
      ])

      const totalResumes = resumesRes.count ?? 0
      const atsData = (atsRes.data ?? []) as { score: number }[]
      const atsScores = atsData.map((r) => r.score)
      const avgAts = atsScores.length ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length) : 0
      const coverLetters = coverRes.count ?? 0

      return { totalResumes, avgAts, coverLetters, totalDownloads: 0 }
    },
    enabled: !!user,
  })
}
