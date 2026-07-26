import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAuthClient } from '@/lib/supabaseServer'

// In-memory store for rate limiting (resets on server restart)
// In production, use Redis or similar persistent store
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5

/**
 * Clean up old entries from the rate limiting map
 */
function cleanupRateLimitMap() {
  const now = Date.now()
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.firstAttempt > RATE_LIMIT_WINDOW_MS) {
      loginAttempts.delete(ip)
    }
  }
}

/**
 * Check if an IP has exceeded the rate limit for login attempts
 */
function isRateLimited(ip: string): boolean {
  cleanupRateLimitMap()

  const data = loginAttempts.get(ip)
  if (!data) {
    return false
  }

  return data.count >= MAX_ATTEMPTS_PER_WINDOW
}

/**
 * Record a failed login attempt for an IP
 */
function recordFailedAttempt(ip: string) {
  const now = Date.now()
  const data = loginAttempts.get(ip)

  if (data) {
    data.count++
    // Keep the original firstAttempt timestamp for window calculation
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
  }
}

/**
 * Clear the rate limit data for an IP (on successful login)
 */
function clearRateLimit(ip: string) {
  loginAttempts.delete(ip)
}

/**
 * Check if a session needs to be renewed (expires in less than 15 minutes)
 */
function needsSessionRenewal(session: any): boolean {
  // If we have an explicit expiration time, use that
  if (session.expires_at) {
    const now = Math.floor(Date.now() / 1000); // Convert to seconds to match expires_at
    const timeUntilExpires = session.expires_at - now;
    // Renew if less than 15 minutes (900 seconds) left
    return timeUntilExpires < 15 * 60;
  }

  // Fallback to the original method based on last_sign_in_at
  if (!session?.user?.identities?.[0]?.last_sign_in_at) {
    return false;
  }

  const lastSignIn = new Date(session.user.identities[0].last_sign_in_at).getTime();
  const now = Date.now();
  // Assuming session duration is 1 hour, renew if less than 15 minutes left
  const sessionDuration = 60 * 60 * 1000; // 1 hour
  const timeElapsed = now - lastSignIn;
  const timeRemaining = sessionDuration - timeElapsed;

  return timeRemaining < 15 * 60 * 1000; // 15 minutes
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    // Get IP address correctly for Next.js 13+
    // @ts-ignore - NextRequest might have ip property in some versions
    const ip = (request as any).ip ??
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        'unknown'

    // Log incoming cookies for debugging
    const cookieHeader = request.headers.get('cookie')
    console.log('middleware: Incoming request - IP:', ip, 'Pathname:', pathname)
    console.log('middleware: Cookie header:', cookieHeader ? cookieHeader.substring(0, 200) + '...' : 'None')

    // Allow access to static assets and next.js internals without authentication
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
      // Let the request proceed to the route handler
      const res = NextResponse.next()

      // Handle cookie updates from Supabase client for static assets, etc.
      try {
        // Create Supabase client to handle cookies properly
        const supabaseAuth = await createSupabaseAuthClient()
        const cookiesToSet = supabaseAuth.getCookiesToSet()
        if (cookiesToSet.length > 0) {
          console.log('middleware: Cookies to set for static route:', cookiesToSet.map(c => ({ name: c.name, options: c.options })))
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
            console.log(`middleware: Set cookie ${name} with options:`, options)
          })
        }
      } catch (e) {
        // Ignore errors getting supabase client for static routes
        console.error('middleware: Error getting supabase client for static route:', e)
      }

      return res
    }

    // Allow access to login page (GET only) without authentication
    if (pathname.startsWith('/admin/login') && request.method === 'GET') {
      // Let the request proceed to the route handler
      const res = NextResponse.next()

      // Handle cookie updates from Supabase client for static assets, etc.
      try {
        // Create Supabase client to handle cookies properly
        const supabaseAuth = await createSupabaseAuthClient()
        const cookiesToSet = supabaseAuth.getCookiesToSet()
        if (cookiesToSet.length > 0) {
          console.log('middleware: Cookies to set for static route:', cookiesToSet.map(c => ({ name: c.name, options: c.options })))
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
            console.log(`middleware: Set cookie ${name} with options:`, options)
          })
        }
      } catch (e) {
        // Ignore errors getting supabase client for static routes
        console.error('middleware: Error getting supabase client for static route:', e)
      }

      return res
    }

    // Special handling for login endpoint - apply rate limiting for POST requests
    if (pathname === '/admin/login' && request.method === 'POST') {
      if (isRateLimited(ip)) {
        console.log('middleware: Rate limit exceeded for IP:', ip)
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        url.searchParams.set('error', 'rate_limited')
        return new NextResponse(null, {
          status: 429, // Too Many Requests
          headers: { Location: url.toString() }
        })
      }

      // Let the login request proceed to the route handler
      // The route handler will handle authentication and cookie setting
      return NextResponse.next()
    }

    // Check if the request is for an admin route (excluding login GET/POST which are handled above)
    if (pathname.startsWith('/admin')) {
      // Create Supabase client for checking session
      const supabaseAuth = await createSupabaseAuthClient()

      const { data: { session }, error: sessionError } = await supabaseAuth.supabase.auth.getSession()
      console.log("========== SESSION CHECK ==========");
      console.log("Session:", session);
      console.log("Session Error:", sessionError);
      console.log("==================================");

      // DEBUG: Log session details
      console.log('middleware: Session check - IP:', ip, 'Pathname:', pathname)
      console.log('middleware: Session data:', session ? 'Present' : 'None')
      if (sessionError) {
        console.error('middleware: Session error:', sessionError.message)
      }
      if (session) {
        console.log('middleware: Session user ID:', session.user?.id)
        console.log('middleware: Session email:', session.user?.email)
      }

      // Handle session-related errors
      if (sessionError) {
        console.error('middleware: Session error:', sessionError.message)
        // Don't expose internal error details to the client
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        url.searchParams.set('error', 'auth_error')
        return NextResponse.redirect(url)
      }

      // Handle no session case
      if (!session) {
        console.log('middleware: No session found for IP:', ip)
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
      }

      // Check if session needs renewal
      if (needsSessionRenewal(session)) {
        console.log('middleware: Session needs renewal for user:', session.user?.id)
        // Attempt to refresh the session
        const { data: refreshData, error: refreshError } = await supabaseAuth.supabase.auth.refreshSession()

        if (refreshError) {
          console.error('middleware: Session refresh failed:', refreshError.message)
          // If refresh fails, treat as unauthenticated
          const url = request.nextUrl.clone()
          url.pathname = '/admin/login'
          url.searchParams.set('error', 'session_expired')
          return NextResponse.redirect(url)
        }

        // Update the session with refreshed data if refresh was successful
        if (refreshData.session) {
          session.user = refreshData.session.user
          // Note: We can update cookies here since we have the response object
          // The cookies will be set below in the cookie handling section
        }
      }

      // Verify that the user is an admin by checking the admins table
      const { data: adminData, error: adminError } = await supabaseAuth.supabase
        .from('admins')
        .select('id')
        .eq('id', session.user.id)
        .single()

      // DEBUG: Log admin check results
      console.log('middleware: Admin check - adminData:', adminData ? 'Found' : 'Not found')
      if (adminError) {
        console.error('middleware: Admin verification error:', adminError.message)
      }

      // Handle admin verification errors
      if (adminError) {
        console.error('middleware: Admin verification error:', adminError.message)
        // Don't expose internal error details but for debugging, let's see what it is
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        url.searchParams.set('error', 'admin_error_details:' + adminError.message.substring(0, 50))
        return NextResponse.redirect(url)
      }

      // Handle non-admin user
      if (!adminData) {
        console.log('middleware: Non-admin user attempted to access admin area:', session.user.email)
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Successful authentication - clear any rate limit for this IP
      if (pathname === '/admin/login' && request.method === 'POST') {
        clearRateLimit(ip)
      }

      // Let the request proceed to the route handler
      const res = NextResponse.next()

      // Handle cookie updates from Supabase client
      try {
        const cookiesToSet = supabaseAuth.getCookiesToSet()
        console.log('middleware: Cookies to set:', cookiesToSet.map(c => ({ name: c.name, options: c.options })))
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
          console.log(`middleware: Set cookie ${name} with options:`, options)
        })
      } catch (e) {
        console.error('middleware: Error getting supabase client:', e)
      }

      // User is authenticated and is an admin, proceed
      console.log('middleware: User authenticated as admin:', session.user.email)
      return res
    }
  } catch (error) {
    // Catch-all for unexpected errors (both sync and async)
    console.error('middleware: Unexpected error:', error)
    // Don't expose internal error details
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('error', 'system_error')
    return NextResponse.redirect(url)
  }

  // For non-admin routes, continue
  const res = NextResponse.next()

  // Handle cookie updates from Supabase client for non-admin routes
  try {
    const supabaseAuth = await createSupabaseAuthClient()
    const cookiesToSet = supabaseAuth.getCookiesToSet()
    if (cookiesToSet.length > 0) {
      console.log('middleware: Cookies to set for non-admin route:', cookiesToSet.map(c => ({ name: c.name, options: c.options })))
      cookiesToSet.forEach(({ name, value, options }) => {
        res.cookies.set(name, value, options)
        console.log(`middleware: Set cookie ${name} with options:`, options)
      })
    }
  } catch (e) {
    // Ignore errors getting supabase client for non-admin routes
    console.error('middleware: Error getting supabase client for non-admin route:', e)
  }

  return res
}