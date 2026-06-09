import { Link } from 'react-router-dom'
import { FileText, Plus, BarChart2, Mail, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDashboardStats, useResumes } from '@/features/resume/hooks/useResumes'
import { ROUTES } from '@/constants'
import { getInitials, formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: resumes, isLoading: resumesLoading } = useResumes()

  const statCards = [
    { label: 'Total Resumes',   value: stats?.totalResumes ?? 0, icon: FileText,    color: 'text-blue-600'  },
    { label: 'Total Downloads', value: stats?.totalDownloads ?? 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'ATS Avg Score',   value: stats?.avgAts ?? 0,        icon: BarChart2,   color: 'text-purple-600', suffix: '/100' },
    { label: 'Cover Letters',   value: stats?.coverLetters ?? 0,  icon: Mail,        color: 'text-orange-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your resume activity at a glance.</p>
        </div>
        <Link to={ROUTES.RESUME_NEW}>
          <Button>
            <Plus className="h-4 w-4" />
            New Resume
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, suffix }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              {statsLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-2 text-3xl font-bold">
                  {value}{suffix ?? ''}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Create Resume', href: ROUTES.RESUME_NEW, icon: Plus },
            { label: 'Browse Templates', href: ROUTES.TEMPLATES, icon: FileText },
            { label: 'ATS Reports', href: ROUTES.ATS_REPORTS, icon: BarChart2 },
            { label: 'Cover Letters', href: ROUTES.COVER_LETTERS, icon: Mail },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Resumes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Resumes</h2>
          <Link to={ROUTES.RESUMES} className="text-sm text-primary hover:underline">View all</Link>
        </div>

        {resumesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : !resumes?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No resumes yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first resume to get started.</p>
              <Link to={ROUTES.RESUME_NEW} className="mt-4">
                <Button><Plus className="h-4 w-4" /> Create Resume</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {resumes.slice(0, 5).map((resume) => (
              <Link key={resume.id} to={ROUTES.RESUME_EDIT(resume.id)}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                        {getInitials(resume.title)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{resume.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {formatDate(resume.updated_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={resume.status === 'published' ? 'default' : 'secondary'}>
                      {resume.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
