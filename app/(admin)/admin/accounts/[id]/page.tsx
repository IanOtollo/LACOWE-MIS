'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from 'lucide-react';

export default function AccountDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  
  const [account, setAccount] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchAccount = async () => {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select(`
            *,
            member:profiles!member_id(first_name, last_name, member_number)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        setAccount(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [supabase, id]);

  if (loading) return <div className="p-6">Loading account details...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!account) return <div className="p-6">Account not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account: {account.account_number}</h1>
          <p className="text-muted-foreground">
            {account.member?.first_name} {account.member?.last_name} ({account.member?.member_number})
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h2 className="text-xl font-semibold">Account Details</h2>
            <Badge tone={account.status === 'active' ? 'success' : 'neutral'}>
              {account.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Type</div>
              <div className="text-sm font-medium capitalize">{account.account_type.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Account Name</div>
              <div className="text-sm font-medium">{account.account_name}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Opened At</div>
              <div className="text-sm font-medium">{account.opened_at ? new Date(account.opened_at).toLocaleDateString() : '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Last Updated</div>
              <div className="text-sm font-medium">{new Date(account.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Balance Information</h2>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-sm text-text-secondary mb-1">Current Balance</div>
            <div className="text-4xl font-bold text-success">
              KES {account.balance.toLocaleString()}
            </div>
          </div>
          <div className="pt-4 border-t border-border flex gap-2">
            <Button variant="ghost" className="w-full">Deposit</Button>
            <Button variant="ghost" className="w-full">Withdraw</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
