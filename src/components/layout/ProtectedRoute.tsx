import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/constants'
import { PageLoader } from '@/components/common/PageLoader'

type Props = { children: ReactNode }

export function ProtectedRoute({ children }: Props) {
  const { user, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) return <PageLoader />

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return <>{children}</>
}
