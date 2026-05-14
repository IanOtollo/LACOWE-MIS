'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';

export default function LoanDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [loan, setLoan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const { data, error } = await supabase
          .from('loans')
          .select(`
            *,
            member:profiles!member_id(first_name, last_name, member_number),
            product:loan_products(name, interest_rate)
          `)
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setLoan(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLoan();
  }, [supabase, params.id]);

  if (loading) return <div className="p-6">Loading loan details...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!loan) return <div className="p-6">Loan not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan #{loan.loan_number}</h1>
          <p className="text-muted-foreground">
            {loan.member?.first_name} {loan.member?.last_name} ({loan.member?.member_number})
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h2 className="text-xl font-semibold">Loan Details</h2>
            <Badge tone={
              loan.status === 'active' ? 'success' : 
              loan.status === 'pending' ? 'warning' : 'neutral'
            }>
              {loan.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Product</div>
              <div className="text-sm font-medium">{loan.product?.name || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Interest Rate</div>
              <div className="text-sm font-medium">{loan.product?.interest_rate || 0}%</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Term (Months)</div>
              <div className="text-sm font-medium">{loan.term_months}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Disbursed At</div>
              <div className="text-sm font-medium">{loan.disbursed_at ? new Date(loan.disbursed_at).toLocaleDateString() : '-'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Financials</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Principal</div>
              <div className="text-sm font-medium text-info">KES {loan.principal_amount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Outstanding Balance</div>
              <div className="text-sm font-medium text-danger">KES {loan.outstanding_balance.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Monthly Repayment</div>
              <div className="text-sm font-medium">KES {loan.monthly_repayment.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Total Paid</div>
              <div className="text-sm font-medium text-success">KES {loan.total_paid.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
