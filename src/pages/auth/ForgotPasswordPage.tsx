import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas/auth.schema'
import { useForgotPassword } from '@/features/auth/hooks/useSignUp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ROUTES } from '@/constants'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { mutate, isPending, error } = useForgotPassword()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  if (sent) {
    return (
      <div className="w-full max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          We sent a password reset link to{' '}
          <strong>{form.getValues('email')}</strong>. Check your spam folder if you don't see it.
        </p>
        <Link to={ROUTES.LOGIN}>
          <Button variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutate(v.email, { onSuccess: () => setSent(true) }))} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Send Reset Link
          </Button>
        </form>
      </Form>

      <Link to={ROUTES.LOGIN} className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
      </Link>
    </div>
  )
}
