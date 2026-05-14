'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { submitLoanApplication } from '@/lib/actions/loans';
import { calculateLoan } from '@/lib/utils/loan-calculator';
import { formatCurrency } from '@/lib/utils/currency';

const loanApplySchema = z.object({
  loanProductId: z.string().min(1, 'Please select a loan product'),
  amountRequested: z.coerce.number().min(1000, 'Minimum amount is KES 1,000'),
  termMonths: z.coerce.number().min(1, 'Minimum term is 1 month').max(72, 'Maximum term is 72 months'),
  purpose: z.string().min(1, 'Please select a loan purpose'),
  purposeDetails: z.string().min(10, 'Please provide more details (min 10 characters)'),
  guarantors: z.array(z.object({
    memberId: z.string().min(1, 'Guarantor is required'),
    amountGuaranteed: z.coerce.number().min(1, 'Amount is required'),
  })).min(1, 'At least one guarantor is required'),
});

type LoanApplyValues = z.infer<typeof loanApplySchema>;

export default function ApplyLoanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: p } = await supabase.from('loan_products').select('*').eq('is_active', true);
      setProducts(p || []);

      const { data: m } = await supabase.from('profiles').select('id, full_name, member_number').neq('id', user?.id);
      setMembers(m || []);
    }
    fetchData();
  }, [supabase]);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<LoanApplyValues>({
    resolver: zodResolver(loanApplySchema),
    defaultValues: {
      loanProductId: '',
      amountRequested: 0,
      termMonths: 12,
      purpose: '',
      purposeDetails: '',
      guarantors: [{ memberId: '', amountGuaranteed: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "guarantors"
  });

  const selectedProductId = watch('loanProductId');
  const amountRequested = watch('amountRequested');
  const termMonths = watch('termMonths');

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const calculation = selectedProduct && amountRequested > 0 
    ? calculateLoan(amountRequested, selectedProduct.interest_rate, termMonths, selectedProduct.processing_fee_percent)
    : null;

  const onSubmit = async (data: LoanApplyValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await submitLoanApplication({
        ...data,
        memberId: user.id,
      });
      
      toast.success('Loan application submitted successfully!');
      router.push('/portal/loans');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Apply for a Loan</h1>
        <p className="text-muted-foreground">Complete the form below to submit your application.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Loan Product *</label>
                <select {...register('loanProductId')} className="w-full border border-border rounded-input px-3 py-2 bg-white">
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.interest_rate}% PA)</option>
                  ))}
                </select>
                {errors.loanProductId && <p className="text-xs text-danger">{errors.loanProductId.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Amount Requested (KES) *</label>
                  <input type="number" {...register('amountRequested')} className="w-full border border-border rounded-input px-3 py-2" />
                  {errors.amountRequested && <p className="text-xs text-danger">{errors.amountRequested.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Term (Months) *</label>
                  <input type="number" {...register('termMonths')} className="w-full border border-border rounded-input px-3 py-2" />
                  {errors.termMonths && <p className="text-xs text-danger">{errors.termMonths.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Purpose Category *</label>
                <select {...register('purpose')} className="w-full border border-border rounded-input px-3 py-2 bg-white">
                  <option value="">Select a purpose...</option>
                  <option value="education">Education / School Fees</option>
                  <option value="medical">Medical Emergency</option>
                  <option value="business">Business / Investment</option>
                  <option value="construction">Construction / Land</option>
                  <option value="personal">Personal / Other</option>
                </select>
                {errors.purpose && <p className="text-xs text-danger">{errors.purpose.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Detailed Explanation *</label>
                <textarea 
                  {...register('purposeDetails')} 
                  rows={3}
                  className="w-full border border-border rounded-input px-3 py-2" 
                />
                {errors.purposeDetails && <p className="text-xs text-danger">{errors.purposeDetails.message}</p>}
              </div>

              <div className="border-t border-border pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Guarantors</h3>
                  <Button type="button" variant="ghost" onClick={() => append({ memberId: '', amountGuaranteed: 0 })}>
                    Add Guarantor
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-start">
                      <div className="flex-1 space-y-1">
                        <select 
                          {...register(`guarantors.${index}.memberId` as const)} 
                          className="w-full border border-border rounded-input px-3 py-2 bg-white"
                        >
                          <option value="">Select member...</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name} ({m.member_number})</option>
                          ))}
                        </select>
                        {errors.guarantors?.[index]?.memberId && <p className="text-xs text-danger">{errors.guarantors[index]?.memberId?.message}</p>}
                      </div>
                      <div className="w-32 space-y-1">
                        <input 
                          type="number" 
                          placeholder="Amount"
                          {...register(`guarantors.${index}.amountGuaranteed` as const)} 
                          className="w-full border border-border rounded-input px-3 py-2"
                        />
                        {errors.guarantors?.[index]?.amountGuaranteed && <p className="text-xs text-danger">{errors.guarantors[index]?.amountGuaranteed?.message}</p>}
                      </div>
                      {fields.length > 1 && (
                        <Button type="button" variant="danger" onClick={() => remove(index)}>×</Button>
                      )}
                    </div>
                  ))}
                  {errors.guarantors?.message && <p className="text-sm text-danger">{errors.guarantors.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" loading={isSubmitting}>Submit Application</Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Loan Calculator</h3>
            {calculation ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Monthly Repayment</span>
                  <span className="font-mono font-semibold">{formatCurrency(calculation.monthlyRepayment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Total Interest</span>
                  <span className="font-mono">{formatCurrency(calculation.totalInterest)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Processing Fee</span>
                  <span className="font-mono">{formatCurrency(calculation.processingFee)}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between font-semibold">
                  <span>Total Repayable</span>
                  <span className="font-mono text-accent">{formatCurrency(calculation.totalRepayable)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary italic">Select a product and enter an amount to see calculations.</p>
            )}
          </Card>

          <Card className="p-6 bg-accent-light border-accent/10">
            <h4 className="text-sm font-bold uppercase tracking-wider text-accent mb-2">Loan Rules</h4>
            <ul className="text-xs space-y-2 text-accent/80 list-disc pl-4">
              <li>Maximum loan is 3x your savings balance.</li>
              <li>You must have at least one guarantor.</li>
              <li>Processing fee is deducted from your savings.</li>
              <li>Interest is calculated on a reducing balance basis.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

