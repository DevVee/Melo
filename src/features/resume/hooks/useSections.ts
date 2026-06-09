import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { SectionType } from '@/types'

type SectionRow = Database['public']['Tables']['resume_sections']['Row']

const KEY = (resumeId: string) => ['resume-sections', resumeId]

export function useSections(resumeId: string) {
  return useQuery({
    queryKey: KEY(resumeId),
    queryFn: async (): Promise<SectionRow[]> => {
      const { data, error } = await supabase
        .from('resume_sections')
        .select('*')
        .eq('resume_id', resumeId)
        .order('sort_order')
      if (error) throw error
      return (data ?? []) as unknown as SectionRow[]
    },
    enabled: !!resumeId,
  })
}

export function useUpdateSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content, is_visible }: { id: string; content?: Record<string, unknown>; is_visible?: boolean }): Promise<SectionRow> => {
      const { data, error } = await supabase
        .from('resume_sections')
        .update({ ...(content !== undefined && { content }), ...(is_visible !== undefined && { is_visible }) })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as SectionRow
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: KEY(data.resume_id) }),
  })
}

export function useReorderSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const promises = updates.map(({ id, sort_order }) =>
        supabase.from('resume_sections').update({ sort_order }).eq('id', id)
      )
      await Promise.all(promises)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resume-sections'] })
    },
  })
}

export function useAddSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ resumeId, sectionType, sortOrder }: { resumeId: string; sectionType: SectionType; sortOrder: number }): Promise<SectionRow> => {
      const { data, error } = await supabase
        .from('resume_sections')
        .insert({ resume_id: resumeId, section_type: sectionType, sort_order: sortOrder, content: {} })
        .select()
        .single()
      if (error) throw error
      return data as unknown as SectionRow
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: KEY(data.resume_id) }),
  })
}

export function useDeleteSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, resumeId }: { id: string; resumeId: string }) => {
      const { error } = await supabase.from('resume_sections').delete().eq('id', id)
      if (error) throw error
      return { resumeId }
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: KEY(data.resumeId) }),
  })
}
