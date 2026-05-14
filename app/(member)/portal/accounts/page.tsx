'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Wallet, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';
import { TransactModal } from '@/components/member/TransactModal';

export default function MemberAccountsPage() {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isTransactOpen, setIsTransactOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const fetchAccounts = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('member_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
      setUserId(userData.user.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [supabase]);

  const handleAddAccount = async (type: string) => {
    setIsAdding(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const accountNo = `ACC-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const { error } = await supabase
        .from('accounts')
        .insert({
          member_id: userData.user.id,
          account_number: accountNo,
          account_type: type,
          account_name: `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} Account`,
          balance: 0,
          status: 'active'
        });

      if (error) throw error;
      
      toast.success('Account added successfully');
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add account');
    } finally {
      setIsAdding(false);
    }
  };

  const columns = [
    {
      accessorKey: 'account_number',
      header: 'Account No.',
      cell: ({ row }: any) => <span className="font-mono font-medium">{row.original.account_number}</span>
    },
    {
      accessorKey: 'account_name',
      header: 'Account Name',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-accent" />
          <span className="font-semibold">{row.original.account_name}</span>
        </div>
      )
    },
    {
      accessorKey: 'account_type',
      header: 'Type',
      cell: ({ row }: any) => <Badge tone="info" className="capitalize">{row.original.account_type.replace('_', ' ')}</Badge>
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }: any) => <span className="font-bold text-lg">{formatCurrency(row.original.balance)}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge tone={status === 'active' ? 'success' : 'neutral'} className="capitalize">
            {status}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => (
        <div className="text-right">
          <Link href={`/portal/accounts/${row.original.id}`}>
            <Button size="sm" variant="ghost">
              <Eye className="h-4 w-4 mr-1" /> View Details
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
          <h1 className="text-3xl font-bold tracking-tight">My Accounts</h1>
          <p className="text-muted-foreground">Manage your savings, shares, and other financial accounts.</p>
        </div>
        <div className="flex gap-2">
           <Button size="sm" variant="secondary" onClick={() => setIsTransactOpen(true)}>
             <Plus className="h-4 w-4 mr-1" /> Deposit / Withdraw
           </Button>
           <Button size="sm" variant="secondary" onClick={() => handleAddAccount('fixed_deposit')} loading={isAdding}>
             <Plus className="h-4 w-4 mr-1" /> New Fixed Deposit
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <Link key={acc.id} href={`/portal/accounts/${acc.id}`}>
            <Card className="p-6 hover:border-accent transition-all cursor-pointer group bg-bg-surface border-border border-2">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  <Wallet className="h-5 w-5" />
                </div>
                <Badge tone={acc.status === 'active' ? 'success' : 'neutral'}>{acc.status}</Badge>
              </div>
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">{acc.account_type.replace('_', ' ')}</h3>
              <div className="text-2xl font-bold mt-1">{formatCurrency(acc.balance)}</div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-xs font-mono text-text-secondary">{acc.account_number}</span>
                <span className="text-xs text-accent font-semibold group-hover:underline">Manage Account →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Accounts History</h2>
        {loading ? (
          <div className="text-sm text-text-secondary">Loading accounts...</div>
        ) : error ? (
          <div className="text-red-500">Failed to load accounts: {error}</div>
        ) : (
          <Table columns={columns} data={accounts} empty="You don't have any accounts yet." />
        )}
      </Card>

      {userId && (
        <TransactModal
          open={isTransactOpen}
          onClose={() => setIsTransactOpen(false)}
          onSuccess={fetchAccounts}
          accounts={accounts}
          memberId={userId}
        />
      )}
    </div>
  );
}
