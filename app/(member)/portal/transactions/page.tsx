'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

export default function MemberTransactionsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData?.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id,
            reference_number,
            transaction_type,
            amount,
            status,
            created_at,
            description,
            account:accounts(account_number, account_type)
          `)
          .eq('member_id', userData.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [supabase]);

  const columns = [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }: any) => format(new Date(row.original.created_at), 'MMM d, yyyy HH:mm')
    },
    {
      accessorKey: 'reference_number',
      header: 'Reference',
    },
    {
      id: 'account',
      header: 'Account',
      cell: ({ row }: any) => {
        const account = row.original.account;
        return (
          <div>
            <div className="capitalize">{account?.account_type ? account.account_type.replace('_', ' ') : '-'}</div>
            <div className="text-xs text-muted-foreground">{account?.account_number || '-'}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'transaction_type',
      header: 'Type',
      cell: ({ row }: any) => (
        <Badge tone="info" className="uppercase">{row.original.transaction_type}</Badge>
      )
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => {
        const type = row.original.transaction_type?.toLowerCase();
        const isPositive = type === 'deposit' || type === 'loan_repayment' || type === 'interest_posted';
        return (
          <span className={isPositive ? 'text-success font-medium' : 'text-danger font-medium'}>
            {isPositive ? '+' : '-'}KES {row.original.amount.toLocaleString()}
          </span>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status?.toLowerCase();
        return (
          <Badge tone={status === 'completed' ? 'success' : 'neutral'} className="capitalize">
            {status}
          </Badge>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View your recent account and loan activities.</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">My History</h2>
        {loading ? (
          <div className="text-sm text-text-secondary">Loading transactions...</div>
        ) : error ? (
          <div className="text-red-500">Failed to load transactions: {error}</div>
        ) : (
          <Table columns={columns} data={transactions} empty="No transactions found." />
        )}
      </Card>
    </div>
  );
}
