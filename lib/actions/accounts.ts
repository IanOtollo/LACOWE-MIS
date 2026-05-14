'use server'

import { createClient } from '@/lib/supabase/server'
import { generateReference } from '@/lib/utils/reference-generator'
import { logAudit } from './audit'

export async function processDeposit(data: {
  memberId: string
  accountId: string
  amount: number
  paymentMethod: string
  mpesaReference?: string
  description?: string
  processedBy: string
}) {
  try {
    const supabase = createClient(true)

    const { data: account } = await supabase
      .from('accounts')
      .select('balance, account_type')
      .eq('id', data.accountId)
      .single()

    if (!account) throw new Error('Account not found')

    const balanceBefore = Number(account.balance ?? 0)
    const balanceAfter = balanceBefore + data.amount

    await supabase
      .from('accounts')
      .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq('id', data.accountId)

    const reference = generateReference('DEP')
    await supabase.from('transactions').insert({
      account_id: data.accountId,
      member_id: data.memberId,
      transaction_type: 'deposit',
      amount: data.amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_number: reference,
      description: data.description || `Deposit to ${account.account_type} account`,
      payment_method: data.paymentMethod,
      mpesa_reference: data.mpesaReference,
      processed_by: data.processedBy,
      status: 'completed',
    })

    await supabase.from('general_ledger').insert([
      {
        account_code: account.account_type === 'savings' ? '1001' : '1002',
        account_name: account.account_type === 'savings' ? 'Member Savings' : 'Member Shares',
        entry_type: 'credit',
        amount: data.amount,
        description: `Deposit - ${reference}`,
        reference_number: reference,
        reference_type: 'transaction',
        created_by: data.processedBy,
      },
      {
        account_code: '1000',
        account_name: 'Cash/Bank',
        entry_type: 'debit',
        amount: data.amount,
        description: `Deposit - ${reference}`,
        reference_number: reference,
        reference_type: 'transaction',
        created_by: data.processedBy,
      },
    ])

    await supabase.from('notifications').insert({
      user_id: data.memberId,
      title: 'Deposit Received',
      message: `A deposit of KES ${data.amount.toLocaleString()} has been credited to your ${account.account_type} account. New balance: KES ${balanceAfter.toLocaleString()}. Ref: ${reference}`,
      type: 'success',
    })

    await logAudit({
      action: 'DEPOSIT',
      module: 'Accounts',
      tableName: 'transactions',
      newData: { amount: data.amount, reference },
    })

    return { success: true, reference, balanceAfter }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process deposit')
  }
}

export async function processWithdrawal(data: {
  memberId: string
  accountId: string
  amount: number
  reason: string
  paymentMethod: string
  processedBy: string
}) {
  try {
    const supabase = createClient(true)

    const { data: account } = await supabase
      .from('accounts')
      .select('balance, account_type')
      .eq('id', data.accountId)
      .single()

    if (!account) throw new Error('Account not found')
    if (Number(account.balance ?? 0) < data.amount) {
      throw new Error(`Insufficient balance. Available: KES ${Number(account.balance ?? 0).toLocaleString()}`)
    }

    const balanceBefore = Number(account.balance ?? 0)
    const balanceAfter = balanceBefore - data.amount

    await supabase
      .from('accounts')
      .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq('id', data.accountId)

    const reference = generateReference('WDR')
    await supabase.from('transactions').insert({
      account_id: data.accountId,
      member_id: data.memberId,
      transaction_type: 'withdrawal',
      amount: data.amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_number: reference,
      description: data.reason,
      payment_method: data.paymentMethod,
      processed_by: data.processedBy,
      status: 'completed',
    })

    await supabase.from('notifications').insert({
      user_id: data.memberId,
      title: 'Withdrawal Processed',
      message: `A withdrawal of KES ${data.amount.toLocaleString()} has been processed from your ${account.account_type} account. New balance: KES ${balanceAfter.toLocaleString()}. Ref: ${reference}`,
      type: 'warning',
    })

    await logAudit({
      action: 'WITHDRAWAL',
      module: 'Accounts',
      tableName: 'transactions',
      newData: { amount: data.amount, reference },
    })

    return { success: true, reference, balanceAfter }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process withdrawal')
  }
}

