import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-8">
      <h1 className="text-7xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl font-semibold">Page not found</p>
      <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Link to={ROUTES.HOME} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Go Home
      </Link>
    </div>
  )
}
