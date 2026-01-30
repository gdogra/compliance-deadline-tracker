import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time, env vars may not be available
  // Return a mock client that won't be used during static generation
  if (!supabaseUrl || !supabaseKey) {
    // Return a minimal mock for build-time safety
    return {
      from: () => ({
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
      auth: {
        getUser: () => ({ data: { user: null }, error: null }),
        signInWithPassword: () => ({ data: null, error: null }),
        signUp: () => ({ data: null, error: null }),
        signOut: () => ({ error: null }),
      },
      rpc: () => ({ data: null, error: null }),
    } as unknown as ReturnType<typeof createBrowserClient<Database>>
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
