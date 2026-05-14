'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RepayModal } from '@/components/member/RepayModal';
import Link from 'next/link';
import { PlusIcon, EyeIcon, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/currency';

export default function MemberLoansPage() {
  const supabase = createClient();
  const [loans, setLoans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [repayLoan, setRepayLoan] = useState<any | null>(null);

  const fetchLoans = async () => {
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) throw new Error('Not authenticated');
      setUserId(userData.user.id);

      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          loan_number,
          principal_amount,
          outstanding_balance,
          monthly_repayment,
          total_paid,
          total_repayable,
          status,
          created_at,
          loan_products(name)
        `)
        .eq('member_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [supabase]);

  const columns = [
    {
      accessorKey: 'loan_number',
      header: 'Loan No.',
      cell: ({ row }: any) => <span className="font-mono font-bold">{row.original.loan_number}</span>
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }: any) => row.original.loan_products?.name || 'Unknown'
    },
    {
      accessorKey: 'principal_amount',
      header: 'Principal',
      cell: ({ row }: any) => formatCurrency(row.original.principal_amount)
    },
    {
      accessorKey: 'outstanding_balance',
      header: 'Outstanding',
      cell: ({ row }: any) => (
        <span className={`font-semibold font-mono ${row.original.outstanding_balance > 0 ? 'text-danger' : 'text-success'}`}>
          {formatCurrency(row.original.outstanding_balance)}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge tone={
            status === 'active' ? 'success' :
            status === 'completed' ? 'info' :
            status === 'defaulted' ? 'danger' : 'neutral'
          } className="capitalize">
            {status}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => (
        <div className="flex justify-end gap-2">
          {row.original.status === 'active' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setRepayLoan(row.original)}
            >
              <CreditCard className="w-3 h-3 mr-1" />
              Repay
            </Button>
          )}
          <Link href={`/portal/loans/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              <EyeIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ),
      meta: { align: 'right' }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Loans</h1>
          <p className="text-muted-foreground">Manage your active and past loans.</p>
        </div>
        <Link href="/portal/loans/apply">
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Apply for Loan
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Loan History</h2>
        {loading ? (
          <div className="text-sm text-text-secondary">Loading loans...</div>
        ) : error ? (
          <div className="text-red-500">Failed to load loans: {error}</div>
        ) : (
          <Table columns={columns} data={loans} empty="You don't have any loans yet." />
        )}
      </Card>

      {repayLoan && userId && (
        <RepayModal
          open={!!repayLoan}
          onClose={() => setRepayLoan(null)}
          loan={repayLoan}
          memberId={userId}
          onSuccess={fetchLoans}
        />
      )}
    </div>
  );
}
