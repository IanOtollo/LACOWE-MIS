import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase/profile'
import { MemberSidebar } from '@/components/member/MemberSidebar'
import { MemberTopbar } from '@/components/member/MemberTopbar'
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const { session, profile } = await getSessionProfile()

  if (!session || !profile) redirect('/login')

  const roleName = (profile as any)?.roles?.name as 'admin' | 'member' | 'committee' | undefined
  const role = roleName === 'member' ? 'member' : 'member'

  const memberNumber = profile.member_number
  const userName = profile.full_name || profile.first_name || 'Member'

  return (
    <div className="min-h-screen">
      <div className="flex">
        <MemberSidebar role={role} userName={userName} memberNumber={memberNumber} />
        <div className="flex-1">
          <MemberTopbar />
          <main className="p-6 pt-14 md:pt-6">{children}</main>
        </div>
      </div>
      <ForcePasswordChange />
    </div>
  )
}

