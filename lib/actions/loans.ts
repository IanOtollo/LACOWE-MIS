'use server'
import { createClient } from '@/lib/supabase/server'
import { generateReference } from '@/lib/utils/reference-generator'
import { calculateLoan, generateRepaymentSchedule } from '@/lib/utils/loan-calculator'
import { logAudit } from './audit'

export async function submitLoanApplication(data: {
  memberId: string
  loanProductId: string
  amountRequested: number
  termMonths: number
  purpose: string
  purposeDetails?: string
  guarantors: Array<{ memberId: string; amountGuaranteed: number }>
}) {
  const supabase = createClient(true)

  // 1. Check member has no active loan
  const { data: activeLoan } = await supabase
    .from('loans')
    .select('id, loan_number')
    .eq('member_id', data.memberId)
    .eq('status', 'active')
    .maybeSingle()

  if (activeLoan) {
    throw new Error(`You have an active loan (${activeLoan.loan_number}). You must fully repay this loan before applying for a new one.`)
  }

  // 2. Check no pending application
  const { data: pendingApp } = await supabase
    .from('loan_applications')
    .select('id')
    .eq('member_id', data.memberId)
    .in('status', ['pending', 'under_review', 'approved'])
    .maybeSingle()

  if (pendingApp) throw new Error('You have a pending loan application. Please wait for it to be processed.')

  // 3. Get loan product
  const { data: product } = await supabase
    .from('loan_products')
    .select('*')
    .eq('id', data.loanProductId)
    .single()

  if (!product) throw new Error('Loan product not found')
  
  // 4. Calculate loan figures
  const calc = calculateLoan(data.amountRequested, product.interest_rate, data.termMonths, product.processing_fee_percent)

  // 5. Create application
  const appNumber = generateReference('LOAN-APP')
  const { data: application, error } = await supabase
    .from('loan_applications')
    .insert({
      application_number: appNumber,
      member_id: data.memberId,
      loan_product_id: data.loanProductId,
      amount_requested: data.amountRequested,
      term_months: data.termMonths,
      purpose: data.purpose,
      purpose_details: data.purposeDetails,
      monthly_repayment: calc.monthlyRepayment,
      total_repayment: calc.totalRepayable,
      total_interest: calc.totalInterest,
      processing_fee: calc.processingFee,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(`Application submission failed: ${error.message}`)

  // 6. Add guarantors
  if (data.guarantors.length > 0) {
    await supabase.from('loan_guarantors').insert(
      data.guarantors.map(g => ({
        loan_application_id: application.id,
        guarantor_member_id: g.memberId,
        amount_guaranteed: g.amountGuaranteed,
        status: 'pending',
      }))
    )

    // Notify each guarantor
    for (const g of data.guarantors) {
      const { data: applicant } = await supabase
        .from('profiles')
        .select('full_name, member_number')
        .eq('id', data.memberId)
        .single()

      await supabase.from('notifications').insert({
        user_id: g.memberId,
        title: 'Guarantor Request',
        message: `${applicant?.full_name} (${applicant?.member_number}) has listed you as a guarantor for a loan of KES ${data.amountRequested.toLocaleString()}. Please respond to this request from your portal.`,
        type: 'guarantor',
        action_url: '/portal/guarantor-requests',
      })
    }
  }

  // 8. Notify applicant
  await supabase.from('notifications').insert({
    user_id: data.memberId,
    title: 'Loan Application Submitted',
    message: `Your loan application (${appNumber}) for KES ${data.amountRequested.toLocaleString()} has been submitted successfully and is under review. You will be notified of any updates.`,
    type: 'loan',
    action_url: `/portal/loans`,
  })

  await logAudit({ action: 'SUBMIT_LOAN_APPLICATION', module: 'Loans', tableName: 'loan_applications', recordId: application.id, newData: { appNumber, amount: data.amountRequested } })

  return { success: true, applicationNumber: appNumber, applicationId: application.id }
}

export async function approveLoanApplication(applicationId: string, approvedBy: string) {
  const supabase = createClient(true)

  await supabase
    .from('loan_applications')
    .update({ status: 'approved', approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq('id', applicationId)

  // Notify the member
  const { data: app } = await supabase
    .from('loan_applications')
    .select('member_id, amount_requested, application_number')
    .eq('id', applicationId)
    .maybeSingle()

  if (app) {
    await supabase.from('notifications').insert({
      user_id: app.member_id,
      title: '✅ Loan Application Approved',
      message: `Your loan application (${app.application_number}) for KES ${Number(app.amount_requested).toLocaleString()} has been approved. It will be disbursed to your account shortly.`,
      type: 'loan',
      action_url: '/portal/loans',
    })
  }

  await supabase
    .from('loan_applications')
    .update({ status: 'approved', approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq('id', applicationId)

  return { success: true }
}

export async function rejectLoanApplication(applicationId: string, rejectedBy: string, reason?: string) {
  const supabase = createClient(true)

  const { data: app } = await supabase
    .from('loan_applications')
    .select('member_id, amount_requested, application_number')
    .eq('id', applicationId)
    .maybeSingle()

  await supabase
    .from('loan_applications')
    .update({ status: 'rejected', reviewed_by: rejectedBy, reviewed_at: new Date().toISOString(), rejection_reason: reason || 'Application did not meet requirements.' })
    .eq('id', applicationId)

  if (app) {
    await supabase.from('notifications').insert({
      user_id: app.member_id,
      title: '❌ Loan Application Rejected',
      message: `Your loan application (${app.application_number}) for KES ${Number(app.amount_requested).toLocaleString()} was not approved. Reason: ${reason || 'Application did not meet requirements.'}`,
      type: 'loan',
      action_url: '/portal/loans',
    })
  }

  await logAudit({ action: 'REJECT_LOAN_APPLICATION', module: 'Loans', tableName: 'loan_applications', recordId: applicationId, newData: { reason } })

  return { success: true }
}

export async function disburseLoan(applicationId: string, disbursedBy: string, disbursementAccountId: string) {
  const supabase = createClient(true)

  const { data: app } = await supabase
    .from('loan_applications')
    .select('*, loan_products(*)')
    .eq('id', applicationId)
    .single()

  if (!app || app.status !== 'approved') throw new Error('Application must be approved before disbursement')

  // Create loan record
  const loanNumber = generateReference('LOAN')
  const disbursementDate = new Date()
  const expectedCompletion = new Date(disbursementDate)
  expectedCompletion.setMonth(expectedCompletion.getMonth() + app.term_months)

  const { data: loan } = await supabase
    .from('loans')
    .insert({
      loan_number: loanNumber,
      member_id: app.member_id,
      loan_application_id: applicationId,
      loan_product_id: app.loan_product_id,
      principal_amount: app.amount_requested,
      interest_rate: app.loan_products.interest_rate,
      term_months: app.term_months,
      monthly_repayment: app.monthly_repayment,
      total_repayable: app.total_repayment,
      total_interest: app.total_interest,
      outstanding_balance: app.amount_requested,
      installments_remaining: app.term_months,
      disbursed_at: disbursementDate.toISOString(),
      expected_completion_date: expectedCompletion.toISOString().split('T')[0],
    })
    .select()
    .single()

  // Generate repayment schedule
  const schedule = generateRepaymentSchedule(
    app.amount_requested,
    app.loan_products.interest_rate,
    app.term_months,
    disbursementDate
  )

  await supabase.from('repayment_schedules').insert(
    schedule.map(s => ({ ...s, loan_id: loan.id }))
  )

  // Update application status
  await supabase.from('loan_applications')
    .update({ status: 'disbursed', disbursed_by: disbursedBy, disbursed_at: disbursementDate.toISOString(), disbursement_account_id: disbursementAccountId })
    .eq('id', applicationId)

  return { success: true, loanNumber }
}
