import { Link } from 'react-router-dom'
import { ROUTES, APP_NAME, APP_TAGLINE } from '@/constants'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="max-w-md text-lg text-muted-foreground">{APP_TAGLINE}</p>
      <div className="flex gap-4">
        <Link
          to={ROUTES.SIGNUP}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Get Started — Free
        </Link>
        <Link
          to={ROUTES.LOGIN}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}
