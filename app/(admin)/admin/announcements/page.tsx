'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function AnnouncementsPage() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setAnnouncements(data || []);
      }
    };
    fetchAnnouncements();
  }, [supabase]);

  const columns = [
    {
      accessorKey: 'published_at',
      header: 'Date',
      cell: ({ row }: any) => format(new Date(row.original.published_at), 'MMM d, yyyy')
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge tone={status === 'PUBLISHED' ? 'success' : 'neutral'}>
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'target_audience',
      header: 'Target Audience',
      cell: ({ row }: any) => (
        <Badge tone="info">{row.original.target_audience}</Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Manage announcements for members.</p>
        </div>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Announcements</h2>
        {error ? (
          <div className="text-red-500">Failed to load announcements: {error}</div>
        ) : (
          <Table columns={columns} data={announcements} />
        )}
      </Card>
    </div>
  );
}
