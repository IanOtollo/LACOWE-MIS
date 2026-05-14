import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { SetAllCookies } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // If env is missing, avoid breaking requests during build tooling.
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }))
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const session = !!user ? { user } : null

  // Not authenticated — redirect to login (except login itself)
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // At this point, either we are on /login or the user is authenticated.
  if (!session) return response

  // Authenticated on login page — redirect based on role
  if (session && pathname === '/login') {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()

    if (error) return response

    let roleName = 'member'
    if (profile?.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).single()
      roleName = roleData?.name || 'member'
    }
    if (roleName === 'admin' || roleName === 'committee') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/portal/dashboard', request.url))
  }

  // Admin routes — only admin and committee
  if (pathname.startsWith('/admin')) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()

    if (error) return response

    let roleName = 'member'
    if (profile?.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).single()
      roleName = roleData?.name || 'member'
    }
    if (roleName === 'member') {
      return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }
  }

  // Member portal — only members
  if (pathname.startsWith('/portal')) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()

    if (error) return response

    let roleName = 'member'
    if (profile?.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).single()
      roleName = roleData?.name || 'member'
    }
    if (roleName === 'admin' || roleName === 'committee') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}

