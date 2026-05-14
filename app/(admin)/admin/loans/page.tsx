'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { EyeIcon, CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function LoansPage() {
  const supabase = createClient();
  const [loans, setLoans] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('pending');
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: l } = await supabase
        .from('loans')
        .select(`
          id, loan_number, principal_amount, outstanding_balance, status, created_at,
          member:profiles!member_id(first_name, last_name, member_number)
        `)
        .order('created_at', { ascending: false });
      setLoans(l || []);

      const { data: a } = await supabase
        .from('loan_applications')
        .select(`
          id, application_number, amount_requested, status, submitted_at,
          member:profiles!member_id(first_name, last_name, member_number),
          product:loan_products(name),
          guarantors:loan_guarantors(id, guarantor:profiles!guarantor_member_id(full_name), status)
        `)
        .order('submitted_at', { ascending: false });
      setApplications(a || []);
    };
    fetchData();
  }, [supabase]);

  const appColumns = [
    {
      accessorKey: 'application_number',
      header: 'App No.',
    },
    {
      accessorKey: 'member',
      header: 'Member',
      cell: ({ row }: any) => {
        const member = row.original.member;
        return member ? `${member.first_name} ${member.last_name}` : '-';
      }
    },
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }: any) => row.original.product?.name
    },
    {
      accessorKey: 'amount_requested',
      header: 'Amount',
      cell: ({ row }: any) => `KES ${row.original.amount_requested.toLocaleString()}`
    },
    {
      accessorKey: 'guarantors',
      header: 'Guarantors',
      cell: ({ row }: any) => {
        const guarantors = row.original.guarantors || [];
        const accepted = guarantors.filter((g: any) => g.status === 'accepted').length;
        return (
          <span className="text-xs">
            {accepted} / {guarantors.length} accepted
          </span>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge tone={row.original.status === 'pending' ? 'warning' : 'neutral'}>
          {row.original.status}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => (
        <div className="text-right">
          <Link href={`/admin/loans/applications/${row.original.id}`}>
            <Button variant="ghost">
              <EyeIcon className="w-4 h-4 mr-2" />
              Review
            </Button>
          </Link>
        </div>
      )
    }
  ];

  const loanColumns = [
    { accessorKey: 'loan_number', header: 'Loan No.' },
    {
      accessorKey: 'member',
      header: 'Member',
      cell: ({ row }: any) => `${row.original.member?.first_name} ${row.original.member?.last_name}`
    },
    {
      accessorKey: 'principal_amount',
      header: 'Principal',
      cell: ({ row }: any) => `KES ${row.original.principal_amount.toLocaleString()}`
    },
    {
      accessorKey: 'outstanding_balance',
      header: 'Balance',
      cell: ({ row }: any) => `KES ${row.original.outstanding_balance.toLocaleString()}`
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => <Badge tone="success">{row.original.status}</Badge>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => (
        <div className="text-right">
          <Link href={`/admin/loans/${row.original.id}`}>
            <Button variant="ghost"><EyeIcon className="w-4 h-4 mr-2" />View</Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loans Management</h1>
          <p className="text-muted-foreground">Manage loan applications and track active loans.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-primary'}`}
        >
          Applications ({applications.length})
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-primary'}`}
        >
          Active Loans ({loans.length})
        </button>
      </div>

      <Card className="p-6">
        {activeTab === 'pending' ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Pending Applications</h2>
            <Table columns={appColumns} data={applications} />
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Active Loans</h2>
            <Table columns={loanColumns} data={loans} />
          </>
        )}
      </Card>
    </div>
  );
}
