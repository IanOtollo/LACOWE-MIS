'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { EyeIcon } from 'lucide-react';

export default function AccountsPage() {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          id,
          account_number,
          account_type,
          balance,
          status,
          created_at,
          member:profiles!member_id(first_name, last_name, member_number)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setAccounts(data || []);
      }
    };
    fetchAccounts();
  }, [supabase]);

  const columns = [
    {
      accessorKey: 'account_number',
      header: 'Account No.',
    },
    {
      accessorKey: 'member',
      header: 'Member',
      cell: ({ row }: any) => {
        const member = row.original.member;
        return member ? `${member.first_name} ${member.last_name} (${member.member_number})` : '-';
      }
    },
    {
      accessorKey: 'account_type',
      header: 'Type',
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }: any) => `KES ${row.original.balance.toLocaleString()}`
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge tone={status === 'ACTIVE' ? 'success' : 'neutral'}>
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
          <Link href={`/admin/accounts/${row.original.id}`}>
            <Button variant="ghost">
              <EyeIcon className="w-4 h-4 mr-2" />
              View
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
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage member savings and share accounts.</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Accounts</h2>
        {error ? (
          <div className="text-red-500">Failed to load accounts: {error}</div>
        ) : (
          <Table columns={columns} data={accounts} />
        )}
      </Card>
    </div>
  );
}
