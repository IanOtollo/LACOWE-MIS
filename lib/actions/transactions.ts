'use server'

import { createClient } from '@/lib/supabase/server'
import { generateTransactionReference } from '@/lib/utils/reference-generator'
import { logAudit } from './audit'
import { revalidatePath } from 'next/cache'

export async function processTransaction(data: {
  memberId: string
  accountId: string
  amount: number
  type: 'deposit' | 'withdrawal'
  paymentMethod: string
  description?: string
}) {
  const supabase = createClient(true) // Use service role for financial integrity

  try {
    // 1. Get current account balance
    const { data: account, error: accError } = await supabase
      .from('accounts')
      .select('balance, account_name, account_type')
      .eq('id', data.accountId)
      .single()

    if (accError || !account) throw new Error('Account not found')

    const currentBalance = Number(account.balance)
    let newBalance = currentBalance

    if (data.type === 'deposit') {
      newBalance += data.amount
    } else {
      if (currentBalance < data.amount) throw new Error('Insufficient funds')
      newBalance -= data.amount
    }

    // 2. Start Transaction (Simulated via multiple calls, ideally use a RPC function)
    // Update balance
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', data.accountId)

    if (updateError) throw updateError

    // Create transaction record
    const reference = generateTransactionReference(data.type === 'deposit' ? 'DEP' : 'WDL')
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        member_id: data.memberId,
        account_id: data.accountId,
        transaction_type: data.type,
        amount: data.amount,
        balance_after: newBalance,
        reference_number: reference,
        description: data.description || `${data.type.toUpperCase()} to ${account.account_name}`,
        payment_method: data.paymentMethod,
        status: 'completed',
        processed_at: new Date().toISOString()
      })

    if (txError) throw txError

    // Log to audit
    await logAudit({
      action: data.type.toUpperCase(),
      module: 'Finance',
      tableName: 'accounts',
      recordId: data.accountId,
      newData: { amount: data.amount, newBalance, reference }
    })

    revalidatePath('/portal/dashboard')
    revalidatePath(`/portal/accounts/${data.accountId}`)

    return { success: true, reference }
  } catch (error: any) {
    throw new Error(error.message || 'Transaction failed')
  }
}
