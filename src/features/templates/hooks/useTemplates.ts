import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { TemplateCategory } from '@/types'

type TemplateRow = Database['public']['Tables']['templates']['Row']

export function useTemplates(category?: TemplateCategory) {
  return useQuery({
    queryKey: ['templates', category],
    queryFn: async (): Promise<TemplateRow[]> => {
      let q = supabase.from('templates').select('*').order('category').order('name')
      if (category) q = q.eq('category', category)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as TemplateRow[]
    },
  })
}
