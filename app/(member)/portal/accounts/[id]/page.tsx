'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { format } from 'date-fns';

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: acc } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (acc) {
        setAccount(acc);
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('account_id', id)
          .order('created_at', { ascending: false });
        setTransactions(txs || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, supabase]);

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading account details...</div>;
  if (!account) return <div className="p-8 text-center text-danger">Account not found</div>;

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
      accessorKey: 'transaction_type',
      header: 'Type',
      cell: ({ row }: any) => {
        const type = row.original.transaction_type?.toLowerCase();
        const isPositive = type === 'deposit' || type === 'loan_repayment' || type === 'interest_posted';
        return (
          <div className="flex items-center gap-2">
            {isPositive ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-danger" />}
            <Badge tone="info" className="uppercase">{row.original.transaction_type}</Badge>
          </div>
        );
      }
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
          <span className={isPositive ? 'text-success font-bold' : 'text-danger font-bold'}>
            {isPositive ? '+' : '-'}{formatCurrency(row.original.amount)}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{account.account_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-text-secondary uppercase font-bold tracking-wider">{account.account_type.replace('_', ' ')}</div>
              <div className="text-xs font-mono text-text-secondary">{account.account_number}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary uppercase font-bold">Current Balance</label>
              <div className="text-3xl font-bold text-text-primary">{formatCurrency(account.balance)}</div>
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase font-bold">Status</label>
              <div><Badge tone={account.status === 'active' ? 'success' : 'neutral'} className="capitalize">{account.status}</Badge></div>
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase font-bold">Opened On</label>
              <div className="text-sm font-medium">{account.opened_at ? format(new Date(account.opened_at), 'MMMM d, yyyy') : '-'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              Transaction History
            </h2>
          </div>
          <Table columns={columns} data={transactions} empty="No transactions found for this account." />
        </Card>
      </div>
    </div>
  );
}
