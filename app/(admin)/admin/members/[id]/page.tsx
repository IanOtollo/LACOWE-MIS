'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from 'lucide-react';

export default function MemberDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  
  const [member, setMember] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchMember = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        setMember(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [supabase, id]);

  if (loading) return <div className="p-6">Loading member details...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!member) return <div className="p-6">Member not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{member.full_name}</h1>
          <p className="text-muted-foreground">{member.member_number} • {member.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">National ID</div>
              <div className="text-sm font-medium">{member.national_id || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Phone</div>
              <div className="text-sm font-medium">{member.phone || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Employment No</div>
              <div className="text-sm font-medium">{member.employment_number || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Department</div>
              <div className="text-sm font-medium">{member.department || '-'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h2 className="text-xl font-semibold">Status & Activity</h2>
            <Badge tone={member.status === 'active' ? 'success' : 'neutral'} className="capitalize">{member.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Date Joined</div>
              <div className="text-sm font-medium">{member.date_joined ? new Date(member.date_joined).toLocaleDateString() : '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">First Login</div>
              <div className="text-sm font-medium">{member.is_first_login ? 'Pending' : 'Completed'}</div>
            </div>
          </div>
          <div className="pt-4 border-t border-border flex gap-2">
            <Button variant="ghost" className="w-full">Edit Member</Button>
            <Button variant={member.status === 'active' ? 'danger' : 'primary'} className="w-full">
              {member.status === 'active' ? 'Suspend Member' : 'Activate Member'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Next of Kin Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Name</div>
              <div className="text-sm font-medium">{member.next_of_kin_name || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Phone</div>
              <div className="text-sm font-medium">{member.next_of_kin_phone || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Relationship</div>
              <div className="text-sm font-medium">{member.next_of_kin_relationship || '-'}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
