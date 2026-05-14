import { createClient } from './server'

export async function getSessionProfile() {
  const supabase = createClient(false)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return { session: null, profile: null }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      `
        id,
        full_name,
        first_name,
        last_name,
        email,
        phone,
        member_number,
        department,
        is_first_login,
        role_id
      `,
    )
    .eq('id', session.user.id)
    .single()

  if (error) return { session, profile: null }

  if (profile?.role_id) {
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('name')
      .eq('id', profile.role_id)
      .maybeSingle()
    
    if (roleData) {
      (profile as any).roles = roleData
    }
  }

  return { session, profile }
}

