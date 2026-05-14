'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Check, X, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { respondToGuarantorRequest } from '@/lib/actions/guarantors';

export default function GuarantorRequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    setUserId(userData.user.id);

    const { data, error } = await supabase
      .from('loan_guarantors')
      .select(`
        *,
        application:loan_applications(
          amount_requested,
          purpose,
          member:profiles!member_id(full_name, member_number)
        )
      `)
      .eq('guarantor_member_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [supabase]);

  const handleResponse = async (id: string, status: 'accepted' | 'declined') => {
    if (!userId) return;
    setProcessing(id);
    try {
      await respondToGuarantorRequest(id, userId, status);
      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update request');
    } finally {
      setProcessing(null);
    }
  };

  const columns = [
    {
      id: 'applicant',
      header: 'Applicant',
      cell: ({ row }: any) => {
        const applicant = row.original.application?.member;
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">{applicant?.full_name}</div>
              <div className="text-xs text-text-secondary">{applicant?.member_number}</div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'amount',
      header: 'Requested Amount',
      cell: ({ row }: any) => (
        <div className="font-mono font-medium">
          {formatCurrency(row.original.application?.amount_requested || 0)}
        </div>
      )
    },
    {
      accessorKey: 'amount_guaranteed',
      header: 'Guaranteed Amount',
      cell: ({ row }: any) => (
        <div className="font-mono text-accent font-bold">
          {formatCurrency(row.original.amount_guaranteed)}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge tone={status === 'accepted' ? 'success' : status === 'declined' ? 'danger' : 'neutral'}>
            {status}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        if (row.original.status !== 'pending') return null;
        return (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => handleResponse(row.original.id, 'declined')} className="text-danger" loading={processing === row.original.id}>
              <X className="h-4 w-4 mr-1" /> Decline
            </Button>
            <Button size="sm" onClick={() => handleResponse(row.original.id, 'accepted')} loading={processing === row.original.id}>
              <Check className="h-4 w-4 mr-1" /> Accept
            </Button>
          </div>
        );
      },
      meta: { align: 'right' }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guarantor Requests</h1>
        <p className="text-muted-foreground">Manage loan guarantee requests from other members.</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Requests Assigned to You</h2>
        {loading ? (
          <div className="text-sm text-text-secondary">Loading requests...</div>
        ) : (
          <Table columns={columns} data={requests} empty="No guarantor requests found." />
        )}
      </Card>
    </div>
  );
}
