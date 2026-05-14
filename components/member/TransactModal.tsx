'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { processTransaction } from '@/lib/actions/transactions';
import { Landmark, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const transactSchema = z.object({
  accountId: z.string().min(1, 'Please select an account'),
  amount: z.coerce.number().min(10, 'Minimum amount is KES 10'),
  type: z.enum(['deposit', 'withdrawal']),
  paymentMethod: z.string().min(1, 'Please select a payment method'),
  description: z.string().optional(),
});

type TransactValues = z.infer<typeof transactSchema>;

interface TransactModalProps {
  open: boolean;
  onClose: () => void;
  accounts: any[];
  memberId: string;
}

export function TransactModal({ open, onClose, accounts, memberId }: TransactModalProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<TransactValues>({
    resolver: zodResolver(transactSchema),
    defaultValues: {
      type: 'deposit',
      paymentMethod: 'mpesa',
      amount: 0
    }
  });

  const type = watch('type');
  const selectedAccountId = watch('accountId');
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const onSubmit = async (data: TransactValues) => {
    setLoading(true);
    try {
      await processTransaction({
        ...data,
        memberId
      });
      toast.success(`${data.type.charAt(0).toUpperCase() + data.type.slice(1)} successful!`);
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Transact Funds">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => reset({ ...watch(), type: 'deposit' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              type === 'deposit' 
                ? 'border-success bg-success/5 text-success' 
                : 'border-border text-text-secondary grayscale hover:grayscale-0'
            }`}
          >
            <ArrowDownCircle className="h-8 w-8" />
            <span className="font-bold">Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => reset({ ...watch(), type: 'withdrawal' })}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              type === 'withdrawal' 
                ? 'border-danger bg-danger/5 text-danger' 
                : 'border-border text-text-secondary grayscale hover:grayscale-0'
            }`}
          >
            <ArrowUpCircle className="h-8 w-8" />
            <span className="font-bold">Withdraw</span>
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-secondary">Select Account</label>
          <select {...register('accountId')} className="w-full border border-border rounded-input px-3 py-2 bg-white">
            <option value="">Select an account...</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.account_name} (KES {a.balance?.toLocaleString()})</option>
            ))}
          </select>
          {errors.accountId && <p className="text-xs text-danger">{errors.accountId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-secondary">Amount (KES)</label>
          <input type="number" {...register('amount')} className="w-full border border-border rounded-input px-3 py-2" />
          {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-secondary">Payment Method</label>
          <select {...register('paymentMethod')} className="w-full border border-border rounded-input px-3 py-2 bg-white">
            <option value="mpesa">M-Pesa</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash / Office Deposit</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-secondary">Description (Optional)</label>
          <input type="text" {...register('description')} placeholder="e.g. Monthly contribution" className="w-full border border-border rounded-input px-3 py-2" />
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} className={type === 'deposit' ? 'bg-success' : 'bg-danger'}>
            Confirm {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
