import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Layout,
  BarChart2,
  Mail,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants'

const NAV_ITEMS = [
  { label: 'Dashboard',     href: ROUTES.DASHBOARD,     icon: LayoutDashboard },
  { label: 'My Resumes',    href: ROUTES.RESUMES,        icon: FileText },
  { label: 'Templates',     href: ROUTES.TEMPLATES,      icon: Layout },
  { label: 'ATS Reports',   href: ROUTES.ATS_REPORTS,    icon: BarChart2 },
  { label: 'Cover Letters', href: ROUTES.COVER_LETTERS,  icon: Mail },
]

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <Sparkles className="h-5 w-5 text-sidebar-primary" />
        <span className="text-xl font-bold text-sidebar-primary">Melo</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <NavLink
                to={href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          AI-powered resume builder
        </p>
      </div>
    </aside>
  )
}
