'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { repayLoan } from '@/lib/actions/repayments'
import { formatCurrency } from '@/lib/utils/currency'
import { CreditCard } from 'lucide-react'

const repaySchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Select a payment method'),
})

type RepayValues = z.infer<typeof repaySchema>

interface RepayModalProps {
  open: boolean
  onClose: () => void
  loan: {
    id: string
    loan_number: string
    outstanding_balance: number
    monthly_repayment: number
  }
  memberId: string
  onSuccess: () => void
}

export function RepayModal({ open, onClose, loan, memberId, onSuccess }: RepayModalProps) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<RepayValues>({
    resolver: zodResolver(repaySchema),
    defaultValues: {
      amount: loan.monthly_repayment,
      paymentMethod: 'savings',
    }
  })

  const amount = watch('amount')

  const onSubmit = async (data: RepayValues) => {
    setLoading(true)
    try {
      const result = await repayLoan({
        loanId: loan.id,
        memberId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
      })
      toast.success(
        result.isFullyRepaid
          ? `🎉 Loan fully repaid! Reference: ${result.reference}`
          : `Repayment of ${formatCurrency(data.amount)} recorded. Ref: ${result.reference}`
      )
      reset()
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Make Loan Repayment">
      <div className="pt-4 space-y-5">
        {/* Loan Summary */}
        <div className="rounded-xl bg-bg-elevated border border-border p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Loan Number</span>
            <span className="font-mono font-bold">{loan.loan_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Outstanding Balance</span>
            <span className="font-mono font-bold text-danger">{formatCurrency(loan.outstanding_balance)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Monthly Installment</span>
            <span className="font-mono">{formatCurrency(loan.monthly_repayment)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">Amount to Pay (KES)</label>
            <input
              type="number"
              {...register('amount')}
              className="w-full border border-border rounded-input px-3 py-2 font-mono"
            />
            {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
            {amount > 0 && amount > loan.outstanding_balance && (
              <p className="text-xs text-warning">Amount exceeds balance — will be capped at {formatCurrency(loan.outstanding_balance)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">Payment Source</label>
            <select {...register('paymentMethod')} className="w-full border border-border rounded-input px-3 py-2 bg-white">
              <option value="savings">Deduct from Savings Account</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
            {errors.paymentMethod && <p className="text-xs text-danger">{errors.paymentMethod.message}</p>}
          </div>

          <p className="text-xs text-text-secondary bg-bg-elevated border border-border rounded-input p-3">
            ⚠️ Repayments made via M-Pesa or Bank Transfer are recorded immediately. Ensure funds are available before submitting.
          </p>

          <div className="pt-2 border-t border-border flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              <CreditCard className="h-4 w-4 mr-2" />
              Confirm Repayment
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
