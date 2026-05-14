'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createMember } from '@/lib/actions/members';
import { toast } from 'sonner';

const memberSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Optional, will be auto-generated if omitted').optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number is required'),
  nationalId: z.string().min(6, 'Valid National ID is required'),
  employmentNumber: z.string().min(1, 'Employment number is required'),
  department: z.string().min(1, 'Department is required'),
  nextOfKinName: z.string().min(2, 'Next of kin name is required'),
  nextOfKinPhone: z.string().min(10, 'Valid phone number is required'),
  nextOfKinRelationship: z.string().min(2, 'Relationship is required'),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function NewMemberPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      employmentNumber: '',
      department: '',
      nextOfKinName: '',
      nextOfKinPhone: '',
      nextOfKinRelationship: '',
    }
  });

  const onSubmit = async (data: MemberFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createMember({
        ...data,
        email: data.email || `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@lacowe.co.ke`,
      });
      
      toast.success('Member created successfully!', {
        description: `Member No: ${result.memberNumber}. Login Email: ${result.email}. Temp Password: ${result.tempPassword}`,
        duration: 10000,
      });
      
      router.push('/admin/members');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Member</h1>
        <p className="text-muted-foreground">Register a new member to the cooperative.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary">First Name *</label>
              <input {...register('firstName')} className="w-full border border-border rounded-input px-3 py-2" />
              {errors.firstName && <p className="text-xs text-danger">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary">Last Name *</label>
              <input {...register('lastName')} className="w-full border border-border rounded-input px-3 py-2" />
              {errors.lastName && <p className="text-xs text-danger">{errors.lastName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary">Phone Number *</label>
              <input {...register('phone')} className="w-full border border-border rounded-input px-3 py-2" />
              {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary">National ID *</label>
              <input {...register('nationalId')} className="w-full border border-border rounded-input px-3 py-2" />
              {errors.nationalId && <p className="text-xs text-danger">{errors.nationalId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary">Employment Number *</label>
              <input {...register('employmentNumber')} className="w-full border border-border rounded-input px-3 py-2" />
              {errors.employmentNumber && <p className="text-xs text-danger">{errors.employmentNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary">Department *</label>
              <input {...register('department')} className="w-full border border-border rounded-input px-3 py-2" />
              {errors.department && <p className="text-xs text-danger">{errors.department.message}</p>}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4">Next of Kin Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Name *</label>
                <input {...register('nextOfKinName')} className="w-full border border-border rounded-input px-3 py-2" />
                {errors.nextOfKinName && <p className="text-xs text-danger">{errors.nextOfKinName.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Phone *</label>
                <input {...register('nextOfKinPhone')} className="w-full border border-border rounded-input px-3 py-2" />
                {errors.nextOfKinPhone && <p className="text-xs text-danger">{errors.nextOfKinPhone.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Relationship *</label>
                <input {...register('nextOfKinRelationship')} className="w-full border border-border rounded-input px-3 py-2" />
                {errors.nextOfKinRelationship && <p className="text-xs text-danger">{errors.nextOfKinRelationship.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Member</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
