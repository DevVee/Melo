import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/constants'
import type { LoginFormValues } from '../schemas/auth.schema'

export function useSignIn() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ email, password }: LoginFormValues) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    onSuccess: () => navigate(ROUTES.DASHBOARD),
  })
}

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${ROUTES.DASHBOARD}` },
      })
      if (error) throw error
    },
  })
}

export function useSignInWithGitHub() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}${ROUTES.DASHBOARD}` },
      })
      if (error) throw error
    },
  })
}
