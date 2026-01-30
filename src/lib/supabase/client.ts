import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Only use mock during server-side build (not in browser)
  if (typeof window === 'undefined' && (!supabaseUrl || !supabaseKey)) {
    // Return a minimal mock for build-time safety only
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        eq: function() { return this },
        neq: function() { return this },
        gt: function() { return this },
        gte: function() { return this },
        lt: function() { return this },
        lte: function() { return this },
        order: function() { return this },
        limit: function() { return this },
        single: function() { return Promise.resolve({ data: null, error: null }) },
        in: function() { return this },
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signUp: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as unknown as ReturnType<typeof createBrowserClient<Database>>
  }

  // In browser or when env vars are available, create real client
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    throw new Error('Supabase credentials not configured')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
