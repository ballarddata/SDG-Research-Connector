import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './AuthContextValue'

async function ensureUserRecord(user) {
  if (!user) return

  const { data: existing, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking user profile', error)
    return
  }

  if (!existing) {
    const profile = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      institution_id: user.user_metadata?.institution_id ?? null,
      byu_net_id: user.user_metadata?.byu_net_id ?? null,
    }

    const { error: insertError } = await supabase.from('users').insert(profile)

    if (insertError) {
      console.error('Error creating user profile', insertError)
    }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Unable to fetch session', error)
      }
      if (mounted) {
        setSession(data?.session ?? null)
        setLoading(false)
        if (data?.session?.user) {
          ensureUserRecord(data.session.user)
        }
      }
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        ensureUserRecord(nextSession.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
