import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase/profile'
import { MemberClientLayout } from '@/app/(member)/portal/MemberClientLayout'
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const { session, profile } = await getSessionProfile()

  if (!session || !profile) redirect('/login')

  const memberNumber = profile.member_number
  const userName = profile.full_name || profile.first_name || 'Member'

  return (
    <>
      <MemberClientLayout userName={userName} memberNumber={memberNumber}>
        {children}
      </MemberClientLayout>
      <ForcePasswordChange />
    </>
  )
}
