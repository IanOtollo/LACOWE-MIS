'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { User, Mail, Phone, Shield, Building } from 'lucide-react';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, roles(name)')
          .eq('id', user.id)
          .single();

        if (error) {
          toast.error('Failed to load profile');
        } else {
          setProfile(data);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase]);

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-danger">Profile not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-accent flex items-center justify-center text-white text-3xl font-bold mb-4">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-text-primary">{profile.full_name}</h2>
          <p className="text-sm text-text-secondary uppercase tracking-widest font-semibold mt-1">
            {profile.roles?.name}
          </p>
          <div className="mt-6 w-full pt-6 border-t border-border">
            <Button variant="secondary" className="w-full">Change Avatar</Button>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Full Name</label>
                <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
                  <User className="h-4 w-4 text-accent" />
                  {profile.full_name}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Email Address</label>
                <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
                  <Mail className="h-4 w-4 text-accent" />
                  {profile.email}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Phone Number</label>
                <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
                  <Phone className="h-4 w-4 text-accent" />
                  {profile.phone || 'Not provided'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Role</label>
                <div className="flex items-center gap-2 text-sm text-text-primary font-medium text-capitalize">
                  <Shield className="h-4 w-4 text-accent" />
                  {profile.roles?.name}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-border pb-2">Organizational Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Member Number</label>
                <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
                  <Building className="h-4 w-4 text-accent" />
                  {profile.member_number || 'Internal Admin'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Joined Date</label>
                <div className="text-sm text-text-primary font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary">Reset Password</Button>
            <Button variant="secondary">Update Profile</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
