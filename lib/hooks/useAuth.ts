'use client'

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
    }
  };

  return { logout };
}
