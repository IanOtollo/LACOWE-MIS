'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from './audit'

export async function seedLoanProducts() {
  const supabase = createClient(true)

  const products = [
    {
      name: 'Emergency Loan',
      description: 'Short-term loan for urgent needs like medical bills or repairs.',
      interest_rate: 12.00,
      max_amount: 50000.00,
      min_amount: 1000.00,
      max_term_months: 3,
      min_term_months: 1,
      requires_guarantor: true,
      min_guarantors: 1,
      max_guarantors: 1,
      processing_fee_percent: 1.00
    },
    {
      name: 'Development Loan',
      description: 'Long-term loan for investments, projects, or major purchases.',
      interest_rate: 10.00,
      max_amount: 500000.00,
      min_amount: 10000.00,
      max_term_months: 36,
      min_term_months: 12,
      requires_guarantor: true,
      min_guarantors: 2,
      max_guarantors: 4,
      processing_fee_percent: 1.50
    },
    {
      name: 'Education Loan',
      description: 'Loan for school fees and other educational expenses.',
      interest_rate: 8.00,
      max_amount: 200000.00,
      min_amount: 5000.00,
      max_term_months: 12,
      min_term_months: 6,
      requires_guarantor: true,
      min_guarantors: 1,
      max_guarantors: 2,
      processing_fee_percent: 1.00
    }
  ]

  // Manual check to avoid duplicate-related crashes if the database constraint is missing
  for (const p of products) {
    const { data: existing } = await supabase.from('loan_products').select('id').eq('name', p.name).maybeSingle()
    if (existing) {
      await supabase.from('loan_products').update(p).eq('id', existing.id)
    } else {
      await supabase.from('loan_products').insert(p)
    }
  }

  await logAudit({ action: 'SEED_LOAN_PRODUCTS', module: 'System', tableName: 'loan_products', recordId: 'seed', newData: { products: products.length } })

  return { success: true, count: products.length }
}
