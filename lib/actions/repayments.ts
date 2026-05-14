'use server'

import { createClient } from '@/lib/supabase/server'
import { generateTransactionReference } from '@/lib/utils/reference-generator'
import { logAudit } from './audit'
import { revalidatePath } from 'next/cache'

export async function repayLoan(data: {
  loanId: string
  memberId: string
  amount: number
  paymentMethod: string
}) {
  const supabase = createClient(true)

  // 1. Fetch the loan
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select('id, loan_number, outstanding_balance, monthly_repayment, status, member_id')
    .eq('id', data.loanId)
    .single()

  if (loanError || !loan) throw new Error('Loan not found')
  if (loan.status !== 'active') throw new Error('This loan is not active')
  if (loan.member_id !== data.memberId) throw new Error('Unauthorized')
  if (data.amount <= 0) throw new Error('Amount must be greater than zero')

  const outstanding = Number(loan.outstanding_balance)
  const repayAmount = Math.min(data.amount, outstanding) // cannot overpay
  const newBalance = outstanding - repayAmount

  // 2. Fetch member's savings account to debit
  const { data: savingsAccount } = await supabase
    .from('accounts')
    .select('id, balance, account_number')
    .eq('member_id', data.memberId)
    .eq('account_type', 'savings')
    .eq('status', 'active')
    .maybeSingle()

  if (!savingsAccount) throw new Error('No active savings account found to debit repayment from')
  if (Number(savingsAccount.balance) < repayAmount) throw new Error(`Insufficient savings balance. Available: KES ${Number(savingsAccount.balance).toLocaleString()}`)

  const newSavingsBalance = Number(savingsAccount.balance) - repayAmount
  const reference = generateTransactionReference('RPMT')

  // 3. Debit savings account
  const { error: savingsError } = await supabase
    .from('accounts')
    .update({ balance: newSavingsBalance, updated_at: new Date().toISOString() })
    .eq('id', savingsAccount.id)

  if (savingsError) throw new Error('Failed to debit savings account')

  // 4. Record the debit transaction
  await supabase.from('transactions').insert({
    member_id: data.memberId,
    account_id: savingsAccount.id,
    transaction_type: 'loan_repayment',
    amount: repayAmount,
    balance_after: newSavingsBalance,
    reference_number: reference,
    description: `Loan repayment for ${loan.loan_number}`,
    payment_method: data.paymentMethod,
    status: 'completed',
    processed_at: new Date().toISOString(),
  })

  // 5. Create a loan_repayment record
  await supabase.from('loan_repayments').insert({
    loan_id: data.loanId,
    member_id: data.memberId,
    amount_paid: repayAmount,
    principal_paid: repayAmount,
    interest_paid: 0,
    reference_number: reference,
    payment_method: data.paymentMethod,
    paid_at: new Date().toISOString(),
  })


  // 6. Get current totals and update loan outstanding balance
  const { data: currentLoan } = await supabase
    .from('loans')
    .select('total_paid, installments_remaining')
    .eq('id', data.loanId)
    .single()

  const newTotalPaid = Number(currentLoan?.total_paid ?? 0) + repayAmount
  const installmentsRemaining = Math.max(0, Number(currentLoan?.installments_remaining ?? 0) - 1)
  const isFullyRepaid = newBalance <= 0

  await supabase.from('loans').update({
    outstanding_balance: newBalance,
    total_paid: newTotalPaid,
    installments_remaining: installmentsRemaining,
    status: isFullyRepaid ? 'completed' : 'active',
    updated_at: new Date().toISOString(),
  }).eq('id', data.loanId)

  // 7. Mark the earliest unpaid schedule installment as paid
  const { data: nextInstallment } = await supabase
    .from('repayment_schedules')
    .select('id')
    .eq('loan_id', data.loanId)
    .in('status', ['pending', 'overdue'])
    .order('due_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (nextInstallment) {
    await supabase.from('repayment_schedules').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      amount_paid: repayAmount,
    }).eq('id', nextInstallment.id)
  }

  // 8. Notify member
  await supabase.from('notifications').insert({
    user_id: data.memberId,
    title: '✅ Loan Repayment Received',
    message: `Your repayment of KES ${repayAmount.toLocaleString()} for loan ${loan.loan_number} has been recorded. Outstanding balance: KES ${newBalance.toLocaleString()}${isFullyRepaid ? ' — Loan fully repaid! Congratulations.' : '.'}`,
    type: 'loan',
    action_url: '/portal/loans',
  })

  await logAudit({
    action: 'LOAN_REPAYMENT',
    module: 'Loans',
    tableName: 'loans',
    recordId: data.loanId,
    newData: { reference, amount: repayAmount, newBalance },
  })

  revalidatePath('/portal/loans')
  revalidatePath('/portal/dashboard')

  return { success: true, reference, newBalance, isFullyRepaid }
}
