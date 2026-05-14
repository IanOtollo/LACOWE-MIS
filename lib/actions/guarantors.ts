'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from './audit'
import { revalidatePath } from 'next/cache'

export async function respondToGuarantorRequest(
  guarantorRecordId: string,
  guarantorMemberId: string,
  status: 'accepted' | 'declined'
) {
  const supabase = createClient(true)

  // 1. Fetch the guarantor record to get the application
  const { data: guarantor } = await supabase
    .from('loan_guarantors')
    .select(`
      id,
      loan_application_id,
      amount_guaranteed,
      guarantor:profiles!guarantor_member_id(full_name, member_number),
      application:loan_applications(
        member_id,
        application_number,
        amount_requested
      )
    `)
    .eq('id', guarantorRecordId)
    .eq('guarantor_member_id', guarantorMemberId)
    .maybeSingle()

  if (!guarantor) throw new Error('Guarantor request not found or unauthorized')

  // 2. Update status
  const { error } = await supabase
    .from('loan_guarantors')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', guarantorRecordId)

  if (error) throw new Error('Failed to update guarantor status')

  // 3. Notify the applicant
  const app = guarantor.application as any
  const guarantorProfile = guarantor.guarantor as any

  if (app?.member_id) {
    const statusText = status === 'accepted' ? 'accepted' : 'declined'
    await supabase.from('notifications').insert({
      user_id: app.member_id,
      title: `Guarantor Request ${status === 'accepted' ? '✅ Accepted' : '❌ Declined'}`,
      message: `${guarantorProfile?.full_name} (${guarantorProfile?.member_number}) has ${statusText} your guarantor request for loan application ${app.application_number}.`,
      type: 'guarantor',
      action_url: '/portal/loans',
    })
  }

  await logAudit({
    action: `GUARANTOR_${status.toUpperCase()}`,
    module: 'Loans',
    tableName: 'loan_guarantors',
    recordId: guarantorRecordId,
    newData: { status, applicationId: guarantor.loan_application_id },
  })

  revalidatePath('/portal/guarantor-requests')

  return { success: true }
}
