'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { approveLoanApplication } from '@/lib/actions/loans';

export default function ApplicationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchApp = async () => {
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          member:profiles!member_id(full_name, member_number, email, phone),
          product:loan_products(*),
          guarantors:loan_guarantors(id, amount_guaranteed, status, guarantor:profiles!guarantor_member_id(full_name, member_number))
        `)
        .eq('id', id)
        .maybeSingle();
      if (data) setApp(data);
      setLoading(false);
    };
    fetchApp();
  }, [supabase, id]);

  const handleApprove = async () => {
    if (!app) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await approveLoanApplication(app.id, user?.id || '');
      toast.success('Application approved!');
      router.push('/admin/loans');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-6">Loading application...</div>;
  if (!app) return <div className="p-6">Application not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Review Application</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Full Name</p>
                <p className="font-medium">{app.member?.full_name}</p>
              </div>
              <div>
                <p className="text-text-secondary">Member Number</p>
                <p className="font-medium font-mono">{app.member?.member_number}</p>
              </div>
              <div>
                <p className="text-text-secondary">Phone</p>
                <p className="font-medium">{app.member?.phone}</p>
              </div>
              <div>
                <p className="text-text-secondary">Email</p>
                <p className="font-medium">{app.member?.email}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-text-secondary">Product</p>
                <p className="font-medium">{app.product?.name}</p>
              </div>
              <div>
                <p className="text-text-secondary">Amount Requested</p>
                <p className="font-medium font-mono text-lg">KES {app.amount_requested.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-text-secondary">Term</p>
                <p className="font-medium">{app.term_months} Months</p>
              </div>
              <div>
                <p className="text-text-secondary">Status</p>
                <Badge tone="warning" className="capitalize">{app.status}</Badge>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-secondary uppercase font-bold mb-1">Purpose</p>
              <p className="text-sm">{app.purpose_details || app.purpose}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Guarantors</h3>
            <div className="space-y-4">
              {app.guarantors?.map((g: any) => (
                <div key={g.id} className="flex justify-between items-center p-3 border border-border rounded-input">
                  <div>
                    <p className="font-medium">{g.guarantor?.full_name}</p>
                    <p className="text-xs text-text-secondary">{g.guarantor?.member_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">KES {g.amount_guaranteed.toLocaleString()}</p>
                    <Badge tone={g.status === 'accepted' ? 'success' : g.status === 'pending' ? 'warning' : 'danger'} className="capitalize">
                      {g.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!app.guarantors || app.guarantors.length === 0) && (
                <p className="text-sm text-text-secondary italic">No guarantors listed.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-accent/20 bg-accent-light/30">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <Button 
                className="w-full bg-success hover:bg-success/90" 
                onClick={handleApprove}
                loading={isProcessing}
                disabled={app.status !== 'pending' && app.status !== 'under_review'}
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Approve Application
              </Button>
              <Button 
                variant="danger" 
                className="w-full"
                disabled={app.status !== 'pending' && app.status !== 'under_review'}
              >
                <XIcon className="w-4 h-4 mr-2" />
                Reject Application
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
