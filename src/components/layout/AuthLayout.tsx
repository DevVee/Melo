import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/constants'
import { PageLoader } from '@/components/common/PageLoader'

export function AuthLayout() {
  const { user, isInitialized } = useAuthStore()

  if (!isInitialized) return <PageLoader />

  // Already authenticated → send to dashboard
  if (user) return <Navigate to={ROUTES.DASHBOARD} replace />

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Brand strip */}
      <header className="flex h-16 items-center px-6 border-b border-border">
        <a href={ROUTES.HOME} className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">Melo</span>
        </a>
      </header>

      {/* Page content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <Outlet />
      </main>
    </div>
  )
}
