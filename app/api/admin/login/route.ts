import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAuthClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const supabaseAuth = await createSupabaseAuthClient()
    const { data, error } = await supabaseAuth.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabaseAuth.supabase
      .from('admins')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (adminError) throw adminError
    if (!adminData) {
      throw new Error('User is not authorized as an admin')
    }

    // Create response and set cookies from Supabase
    const response = NextResponse.json({ user: data.user })
    const cookiesToSet = supabaseAuth.getCookiesToSet()
    console.log("Cookies to set:", cookiesToSet);
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 400 })
  }
}