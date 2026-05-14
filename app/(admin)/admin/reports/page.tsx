'use client'

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DownloadIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

export default function ReportsPage() {
  const supabase = createClient();
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const downloadCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMembersCSV = async () => {
    setLoadingType('members_csv');
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      downloadCSV(data, 'members_register');
      toast.success('Members CSV exported');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export');
    } finally {
      setLoadingType(null);
    }
  };

  const exportFinancialsPDF = async () => {
    setLoadingType('financials_pdf');
    try {
      const { data, error } = await supabase.from('accounts').select('*, member:profiles!member_id(first_name, last_name)');
      if (error) throw error;
      
      const doc = new jsPDF();
      doc.text('LACOWE Welfare Group - Financial Summary', 14, 15);
      
      const tableData = data.map(acc => [
        acc.account_number,
        acc.member ? `${acc.member.first_name} ${acc.member.last_name}` : 'Unknown',
        acc.account_type,
        `KES ${acc.balance.toLocaleString()}`
      ]);

      (doc as any).autoTable({
        head: [['Account No', 'Member', 'Type', 'Balance']],
        body: tableData,
        startY: 25,
      });

      doc.save('financial_summary.pdf');
      toast.success('Financials PDF exported');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export');
    } finally {
      setLoadingType(null);
    }
  };

  const exportTransactionsCSV = async () => {
    setLoadingType('transactions_csv');
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      downloadCSV(data, 'recent_transactions');
      toast.success('Transactions CSV exported');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and download system reports.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Member Register</h3>
            <p className="text-sm text-text-secondary">Full list of all registered members and their status.</p>
          </div>
          <Button 
            className="w-full" 
            variant="ghost" 
            onClick={exportMembersCSV}
            loading={loadingType === 'members_csv'}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Financial Summary</h3>
            <p className="text-sm text-text-secondary">Overview of total savings, shares, and active accounts.</p>
          </div>
          <Button 
            className="w-full" 
            variant="ghost" 
            onClick={exportFinancialsPDF}
            loading={loadingType === 'financials_pdf'}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <p className="text-sm text-text-secondary">System transactions for the last 30 days.</p>
          </div>
          <Button 
            className="w-full" 
            variant="ghost" 
            onClick={exportTransactionsCSV}
            loading={loadingType === 'transactions_csv'}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </Card>
      </div>
    </div>
  );
}
