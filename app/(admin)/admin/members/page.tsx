'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { PlusIcon, EyeIcon } from 'lucide-react';

export default function MembersPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          member_number,
          first_name,
          last_name,
          national_id,
          phone,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setMembers(data || []);
      }
    };
    fetchMembers();
  }, [supabase]);

  const columns = [
    {
      accessorKey: 'member_number',
      header: 'Member No.',
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }: any) => `${row.original.first_name} ${row.original.last_name}`
    },
    {
      accessorKey: 'national_id',
      header: 'National ID',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge tone={status === 'ACTIVE' ? 'success' : 'neutral'}>
            {status}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => (
        <div className="text-right">
          <Link href={`/admin/members/${row.original.id}`}>
            <Button variant="ghost">
              <EyeIcon className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>
        </div>
      ),
      meta: { align: 'right' }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">Manage cooperative members.</p>
        </div>
        <Link href="/admin/members/new">
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Members</h2>
        {error ? (
          <div className="text-red-500">Failed to load members: {error}</div>
        ) : (
          <Table columns={columns} data={members} />
        )}
      </Card>
    </div>
  );
}
