import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page and static assets without authentication
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check if the request is for an admin route
  if (pathname.startsWith('/admin')) {
    console.log('middleware: Processing admin request for path:', pathname)

    // Log cookies from request object
    console.log('middleware: Request cookies:', request.cookies.getAll().map(c => ({ name: c.name, value: '**HIDDEN**' })))

    // Get the session from the request cookies
    const supabase = await createSupabaseServerClient()

    // Log cookies from next/headers cookies() function
    const cookieStore = await cookies()
    console.log('middleware: Next/headers cookies received:', cookieStore.getAll().map(c => ({ name: c.name, value: '**HIDDEN**' })))

    const res = await supabase.auth.getSession()
    const { data: { session } } = res
    console.log('middleware: Session retrieved:', session ? { userId: session.user.id, email: session.user.email } : 'null')

    if (!session) {
      // No session, redirect to login
      console.log('middleware: No session found, redirecting to login')
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    // Optionally, verify that the user is an admin by checking the admins table
    console.log('middleware: Checking admin status for user ID:', session.user.id)
    const { data: adminData, error } = await supabase
      .from('admins')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (error || !adminData) {
      // User is not an admin, redirect to home or show error
      console.log('middleware: User is not an admin. Error:', error, 'AdminData:', adminData)
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // User is authenticated and is an admin, proceed
    console.log('middleware: User is authenticated admin, proceeding to requested path')
    return NextResponse.next()
  }

  // For non-admin routes, continue
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}