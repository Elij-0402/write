'use client'
import { createClient } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

const SupabaseContext = createContext<{ user: User | null }>({ user: null })

export function useSupabase() { return useContext(SupabaseContext) }

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  return <SupabaseContext.Provider value={{ user }}>{children}</SupabaseContext.Provider>
}
