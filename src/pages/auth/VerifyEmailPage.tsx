import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md text-center space-y-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-10 w-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to your email address. Click the link to activate your account.
          Check your spam folder if you don't see it.
        </p>
      </div>

      <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
        After verifying, you'll be redirected to your dashboard automatically.
      </div>

      <Link to={ROUTES.LOGIN}>
        <Button variant="outline" className="w-full">
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Button>
      </Link>
    </div>
  )
}
