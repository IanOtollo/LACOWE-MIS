'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordValues = z.infer<typeof passwordSchema>;

export function ForcePasswordChange() {
  const supabase = createClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const checkFirstLogin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_first_login')
        .eq('id', userData.user.id)
        .single();

      if (profile?.is_first_login) {
        setUserId(userData.user.id);
        setIsOpen(true);
      }
    };
    checkFirstLogin();
  }, [supabase]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordValues) => {
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) throw updateError;

      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_first_login: false })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      toast.success('Password updated successfully!');
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      open={isOpen} 
      onClose={() => {}} 
      title="Secure Your Account"
    >
      <div className="flex flex-col items-center text-center mb-6">
        <div className="h-16 w-16 bg-warning-light text-warning rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">First Time Login</h2>
        <p className="text-sm text-text-secondary mt-2">
          For your security, you are required to change the temporary password provided by the administrator.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">New Password</label>
          <div className="relative group">
            <input 
              type={showPassword ? 'text' : 'password'} 
              {...register('password')} 
              placeholder="Min. 8 characters"
              className="w-full border-2 border-border focus:border-accent rounded-input px-4 py-3 outline-none transition-all" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger font-medium">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Confirm Password</label>
          <div className="relative group">
            <input 
              type={showConfirm ? 'text' : 'password'} 
              {...register('confirmPassword')} 
              placeholder="Repeat your new password"
              className="w-full border-2 border-border focus:border-accent rounded-input px-4 py-3 outline-none transition-all" 
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-danger font-medium">{errors.confirmPassword.message}</p>}
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button 
            type="submit" 
            loading={isSubmitting}
            className="w-full py-4 text-lg"
          >
            Update & Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
