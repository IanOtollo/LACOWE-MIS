import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase/profile'
import { AdminClientLayout } from './AdminClientLayout'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { session, profile } = await getSessionProfile()

  if (!session || !profile) redirect('/login')

  const roleName = (profile as any)?.roles?.name as 'admin' | 'member' | 'committee' | undefined
  const role = roleName === 'committee' ? 'committee' : 'admin'

  const memberNumber = profile.member_number
  const userName = profile.full_name || profile.first_name

  return (
    <AdminClientLayout 
      role={role} 
      userName={userName} 
      memberNumber={memberNumber}
    >
      {children}
    </AdminClientLayout>
  )
}
