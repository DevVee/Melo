import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'

/**
 * On first visit: auto sign in anonymously (no login screen).
 * On return visits: restores the persisted session from localStorage.
 * Always sets isInitialized = true so the app never stays stuck loading.
 */
export function useAuthListener() {
  const { setUser, setSession, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // Returning visitor — restore existing session
          setSession(session)
          setUser(session.user)
        } else {
          // First visit — try to create an anonymous session
          try {
            const { data, error } = await supabase.auth.signInAnonymously()
            if (error) throw error
            setSession(data.session)
            setUser(data.user ?? null)
          } catch {
            // Anonymous sign-in failed (not enabled in Supabase yet)
            // App still loads — user will see an actionable message
            console.warn(
              '[Melo] Anonymous sign-in failed. ' +
              'Go to Supabase → Authentication → Providers → enable "Anonymous".'
            )
          }
        }
      } catch (err) {
        console.error('[Melo] Auth init error:', err)
      } finally {
        // Always unblock the app — never stay stuck
        setLoading(false)
        setInitialized(true)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading, setInitialized])
}

export function useAuth() {
  const { user, session, isLoading, isInitialized } = useAuthStore()
  return { user, session, isLoading, isInitialized, isAuthenticated: !!user }
}
