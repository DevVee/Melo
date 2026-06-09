import { useQuery } from '@tanstack/react-query'
import { BarChart2, Users, FileText, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

function useAdminStats() {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [usersRes, resumesRes, atsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('resumes').select('id', { count: 'exact' }),
        supabase.from('ats_reports').select('score'),
      ])
      const scores = (atsRes.data ?? []).map(r => r.score)
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      return {
        totalUsers: usersRes.count ?? 0,
        totalResumes: resumesRes.count ?? 0,
        totalAtsReports: scores.length,
        avgAtsScore: avgScore,
      }
    },
  })
}

export default function AdminAnalyticsPage() {
  const { data: stats, isLoading } = useAdminStats()

  const cards = [
    { label: 'Total Users',     value: stats?.totalUsers,    icon: Users,    color: 'text-blue-600' },
    { label: 'Total Resumes',   value: stats?.totalResumes,  icon: FileText,  color: 'text-green-600' },
    { label: 'ATS Reports',     value: stats?.totalAtsReports, icon: BarChart2, color: 'text-purple-600' },
    { label: 'Avg ATS Score',   value: stats?.avgAtsScore ? `${stats.avgAtsScore}/100` : '—', icon: Star, color: 'text-yellow-600' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Platform Analytics</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              {isLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-2 text-3xl font-bold">{value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
