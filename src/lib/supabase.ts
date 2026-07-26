import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll: () => {
        // During build/SSR, document doesn't exist
        if (typeof document === 'undefined') {
          return []
        }

        return document.cookie
          .split('; ')
          .filter((cookie) => cookie.length > 0)
          .map((cookie) => {
            const [name, value] = cookie.split('=')

            return {
              name,
              value: value ?? '',
            }
          })
      },

      setAll: (cookiesToSet) => {
        // During build/SSR, document doesn't exist
        if (typeof document === 'undefined') {
          return
        }

        cookiesToSet.forEach(({ name, value, options }) => {
          let cookieString = `${name}=${value || ''}`

          cookieString += `; path=${options.path || '/'}`
          cookieString += `; sameSite=${options.sameSite || 'lax'}`

          if (options.maxAge !== undefined) {
            cookieString += `; max-age=${options.maxAge}`
          }

          if (options.secure) {
            cookieString += '; secure'
          }

          document.cookie = cookieString
        })
      },
    },
  }
)