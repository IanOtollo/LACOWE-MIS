'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTransactions = async () => {
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
          account:accounts(account_number, account_type, member:profiles(first_name, last_name))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setTransactions(data || []);
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
      id: 'member_account',
      header: 'Member/Account',
      cell: ({ row }: any) => {
        const account = row.original.account;
        const member = account?.member;
        return (
          <div>
            <div>{member ? `${member.first_name} ${member.last_name}` : '-'}</div>
            <div className="text-xs text-muted-foreground">{account?.account_number || '-'}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'transaction_type',
      header: 'Type',
      cell: ({ row }: any) => (
        <Badge tone="info">{row.original.transaction_type}</Badge>
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
        const type = row.original.transaction_type;
        const isPositive = type === 'DEPOSIT' || type === 'REPAYMENT' || type === 'INTEREST_POSTED';
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
        const status = row.original.status;
        return (
          <Badge tone={status === 'COMPLETED' ? 'success' : 'neutral'}>
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
          <p className="text-muted-foreground">View all system transactions.</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {error ? (
          <div className="text-red-500">Failed to load transactions: {error}</div>
        ) : (
          <Table columns={columns} data={transactions} />
        )}
      </Card>
    </div>
  );
}
