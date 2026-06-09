import { lazy, Suspense } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Users, LayoutTemplate, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageLoader } from '@/components/common/PageLoader'

const AdminUsers     = lazy(() => import('./AdminUsersPage'))
const AdminTemplates = lazy(() => import('./AdminTemplatesPage'))
const AdminAnalytics = lazy(() => import('./AdminAnalyticsPage'))

const NAV = [
  { label: 'Users',     href: '/admin/users',     icon: Users },
  { label: 'Templates', href: '/admin/templates',  icon: LayoutTemplate },
  { label: 'Analytics', href: '/admin/analytics',  icon: BarChart2 },
]

export default function AdminPage() {
  const { pathname } = useLocation()

  return (
    <div className="flex gap-6 min-h-full">
      {/* Admin sidebar */}
      <aside className="w-48 shrink-0">
        <div className="sticky top-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Admin Panel</p>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users"     element={<AdminUsers />} />
            <Route path="templates" element={<AdminTemplates />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}
