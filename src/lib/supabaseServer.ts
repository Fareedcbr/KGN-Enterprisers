import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for user-specific operations (respects RLS)
 * Use this for operations that should follow the current user's permissions
 */
export const createSupabaseAuthClient = async () => {
  const cookieStore = await cookies()

  // We'll collect cookies that need to be set
  let cookiesToSet: Array<{ name: string; value: string; options?: { path?: string; maxAge?: number | undefined; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean } }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: (cookiesToSetInternal, _headers) => {
          cookiesToSet = cookiesToSetInternal.map(cookie => ({
            ...cookie,
            // Ensure cookies are accessible to the frontend
            options: {
              ...cookie.options,
              path: '/', // Make available to all routes
              sameSite: 'lax' as const, // Allow sending with top-level navigation
              secure: process.env.NODE_ENV === 'production' // Only secure in production
            }
          }));
        },
      },
    }
  )

  // Return an object that contains both the client and a way to get/set cookies
  return {
    supabase,
    getCookiesToSet: () => cookiesToSet,
  }
}

/**
 * Creates a Supabase client for administrative operations (bypasses RLS)
 * Use this for backend operations that need elevated privileges
 * ONLY USE THIS ON THE SERVER SIDE - NEVER EXPOSE TO CLIENT
 */
export const createSupabaseAdminClient = async () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not defined. This is required for server-side operations.'
    )
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}