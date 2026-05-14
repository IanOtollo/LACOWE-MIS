'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          status,
          created_at,
          full_name,
          member_number,
          roles(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setUsers(data || []);
      }
    };
    fetchUsers();
  }, [supabase]);

  const columns = [
    {
      accessorKey: 'full_name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }: any) => {
        const role = row.original.roles?.name || 'No Role';
        return (
          <Badge tone={role === 'admin' ? 'success' : 'neutral'}>
            {role}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'member_number',
      header: 'Member No.',
      cell: ({ row }: any) => row.original.member_number || 'N/A'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge tone={status === 'active' ? 'success' : 'neutral'}>
            {status}
          </Badge>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Users</h1>
          <p className="text-muted-foreground">Manage admin and member portal access.</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        {error ? (
          <div className="text-red-500">Failed to load users: {error}</div>
        ) : (
          <Table columns={columns} data={users} />
        )}
      </Card>
    </div>
  );
}
