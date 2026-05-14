'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function MemberProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData?.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [supabase]);

  if (loading) {
    return <div className="p-6 text-sm text-text-secondary">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Failed to load profile: {error}</div>;
  }

  if (!profile) {
    return <div className="p-6 text-sm text-text-secondary">Profile not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal and membership details.</p>
        </div>
        <Button variant="ghost">Edit Profile</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Full Name</div>
              <div className="text-sm font-medium">{profile.full_name}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">National ID</div>
              <div className="text-sm font-medium">{profile.national_id || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Email</div>
              <div className="text-sm font-medium">{profile.email}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Phone</div>
              <div className="text-sm font-medium">{profile.phone || '-'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Membership Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Member Number</div>
              <div className="text-sm font-medium">{profile.member_number || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Status</div>
              <div className="mt-1">
                <Badge tone={profile.status === 'active' ? 'success' : 'neutral'}>
                  {profile.status}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Employment Number</div>
              <div className="text-sm font-medium">{profile.employment_number || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Department</div>
              <div className="text-sm font-medium">{profile.department || '-'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold border-b border-border pb-2">Next of Kin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Name</div>
              <div className="text-sm font-medium">{profile.next_of_kin_name || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Phone</div>
              <div className="text-sm font-medium">{profile.next_of_kin_phone || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase font-semibold">Relationship</div>
              <div className="text-sm font-medium">{profile.next_of_kin_relationship || '-'}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
