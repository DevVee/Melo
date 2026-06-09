import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/constants'
import type { SignupFormValues } from '../schemas/auth.schema'

export function useSignUp() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ email, password, full_name }: SignupFormValues) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name },
          emailRedirectTo: `${window.location.origin}${ROUTES.VERIFY_EMAIL}`,
        },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => navigate(ROUTES.VERIFY_EMAIL),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
      })
      if (error) throw error
    },
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    onSuccess: () => navigate(ROUTES.LOGIN),
  })
}

export function useSignOut() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => navigate(ROUTES.LOGIN),
  })
}
