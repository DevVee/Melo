import { Link } from 'react-router-dom'
import { Menu, Sparkles } from 'lucide-react'
import { ROUTES } from '@/constants'

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      {/* Mobile: show brand */}
      <Link
        to={ROUTES.DASHBOARD}
        className="flex items-center gap-2 md:hidden font-bold text-lg"
      >
        <Sparkles className="h-5 w-5 text-primary" />
        Melo
      </Link>

      {/* Spacer for desktop (brand is in sidebar) */}
      <div className="hidden md:block" />

      {/* Right side — minimal, no user auth */}
      <div className="ml-auto flex items-center gap-3">
        <Link
          to={ROUTES.RESUME_NEW}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          + New Resume
        </Link>

        {/* Mobile menu toggle (placeholder) */}
        <button className="md:hidden p-1 rounded text-muted-foreground hover:text-foreground">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
