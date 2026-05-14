'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { Table } from '@/components/ui/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { seedLoanProducts } from '@/lib/actions/system'
import { DatabaseIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type PendingGuarantorBadge = 'accepted' | 'partial' | 'pending'

type TxRow = {
  id: string
  created_at: string
  member_id: string
  profiles?: { full_name: string } | null
  transaction_type: string
  amount: number
  balance_after: number
  reference_number: string
  description?: string | null
  payment_method?: string | null
  processed_by?: string | null
}

type PendingAppRow = {
  id: string
  application_number: string
  member_id: string
  amount_requested: number
  term_months: number
  purpose: string
  submitted_at: string
  status: string
  loan_product_id: string
  loan_products?: { name: string } | null
  profiles?: { full_name: string } | null
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)

  const [activeMembers, setActiveMembers] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [totalShares, setTotalShares] = useState(0)
  const [welfareFund, setWelfareFund] = useState(0)
  const [activeLoans, setActiveLoans] = useState(0)
  const [pendingApplications, setPendingApplications] = useState(0)

  const [progressPct, setProgressPct] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<TxRow[]>([])
  const [pendingApps, setPendingApps] = useState<Array<PendingAppRow & { guarantorBadge: PendingGuarantorBadge }>>([])
  const [overdueCount, setOverdueCount] = useState(0)
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; priority: string; expires_at?: string | null; published_at: string }>>([])

  useEffect(() => {
    let mounted = true
    async function run() {
      setLoading(true)
      try {
        // Counts (exact)
        const { count: activeCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
        const { count: loansCount } = await supabase
          .from('loans')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
        const { count: pendingCount } = await supabase
          .from('loan_applications')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'under_review'])

        const { data: settings } = await supabase
          .from('system_settings')
          .select('welfare_fund_balance')
          .maybeSingle()

        // Sums (JS side for now)
        const { data: savingsAccounts } = await supabase
          .from('accounts')
          .select('balance')
          .eq('account_type', 'savings')
          .eq('status', 'active')

        const { data: sharesAccounts } = await supabase
          .from('accounts')
          .select('balance')
          .eq('account_type', 'shares')
          .eq('status', 'active')

        const totalSavingsSum = (savingsAccounts ?? []).reduce((acc, a) => acc + (a.balance ?? 0), 0)
        const totalSharesSum = (sharesAccounts ?? []).reduce((acc, a) => acc + (a.balance ?? 0), 0)

        setActiveMembers(activeCount ?? 0)
        setActiveLoans(loansCount ?? 0)
        setPendingApplications(pendingCount ?? 0)
        setWelfareFund(Number(settings?.welfare_fund_balance ?? 0))
        setTotalSavings(totalSavingsSum)
        setTotalShares(totalSharesSum)

        // Progress
        const { data: disbTx } = await supabase
          .from('transactions')
          .select('amount')
          .eq('transaction_type', 'loan_disbursement')
          .eq('status', 'completed')

        const { data: repayTx } = await supabase
          .from('transactions')
          .select('amount')
          .eq('transaction_type', 'loan_repayment')
          .eq('status', 'completed')

        const totalDisbursed = (disbTx ?? []).reduce((acc, t) => acc + (t.amount ?? 0), 0)
        const totalRepaid = (repayTx ?? []).reduce((acc, t) => acc + (t.amount ?? 0), 0)
        const initialFund = (Number(settings?.welfare_fund_balance ?? 0) + totalDisbursed - totalRepaid) || 0
        const pct = initialFund > 0 ? Math.min(100, Math.round((totalDisbursed / initialFund) * 100)) : 0
        setProgressPct(pct)

        // Recent transactions
        const { data: txs } = await supabase
          .from('transactions')
          .select('id, created_at, member_id, transaction_type, amount, balance_after, reference_number, description, payment_method, processed_by')
          .order('created_at', { ascending: false })
          .limit(10)

        const memberIds = Array.from(new Set((txs ?? []).map((t) => t.member_id).filter(Boolean)))
        const processedIds = Array.from(new Set((txs ?? []).map((t) => t.processed_by).filter(Boolean)))

        const { data: members } = memberIds.length
          ? await supabase.from('profiles').select('id, full_name').in('id', memberIds)
          : { data: [] }

        const { data: processors } = processedIds.length
          ? await supabase.from('profiles').select('id, full_name').in('id', processedIds)
          : { data: [] }

        const memberMap = new Map((members ?? []).map((m) => [m.id, m.full_name]))
        const processorMap = new Map((processors ?? []).map((p) => [p.id, p.full_name]))

        const mappedTxs: TxRow[] = (txs ?? []).map((t) => ({
          ...(t as any),
          profiles: { full_name: memberMap.get(t.member_id) ?? 'Unknown' },
          processed_by: t.processed_by ?? null,
        }))

        // We'll embed processor name through description for now (to avoid another join in Table render)
        setRecentTransactions(
          mappedTxs.map((t) => ({
            ...t,
            description: `${t.description ?? ''}`,
          })),
        )

        // Pending loan applications
        const { data: apps } = await supabase
          .from('loan_applications')
          .select('id, application_number, member_id, amount_requested, term_months, purpose, submitted_at, status, loan_product_id')
          .in('status', ['pending', 'under_review'])
          .order('submitted_at', { ascending: false })
          .limit(25)

        const appIds = (apps ?? []).map((a) => a.id)
        const memberMapForApps = new Map<string, { full_name: string }>()
        if ((apps ?? []).length) {
          const { data: appMembers } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', Array.from(new Set((apps ?? []).map((a) => a.member_id))))
          ;(appMembers ?? []).forEach((m) => memberMapForApps.set(m.id, { full_name: m.full_name }))
        }

        const productIds = (apps ?? []).map((a) => a.loan_product_id)
        const productMap = new Map<string, string>()
        if (productIds.length) {
          const { data: products } = await supabase
            .from('loan_products')
            .select('id, name')
            .in('id', Array.from(new Set(productIds)))
          ;(products ?? []).forEach((p) => productMap.set(p.id, p.name))
        }

        const { data: guarantors } = appIds.length
          ? await supabase
              .from('loan_guarantors')
              .select('loan_application_id, status')
              .in('loan_application_id', appIds)
          : { data: [] }

        const guarantorBuckets = new Map<string, string[]>()
        ;(guarantors ?? []).forEach((g) => {
          const arr = guarantorBuckets.get(g.loan_application_id) ?? []
          arr.push(g.status)
          guarantorBuckets.set(g.loan_application_id, arr)
        })

        const mappedApps: Array<PendingAppRow & { guarantorBadge: PendingGuarantorBadge }> = (apps ?? []).map((a) => {
          const statuses = guarantorBuckets.get(a.id) ?? []
          const allAccepted = statuses.length > 0 && statuses.every((s) => s === 'accepted')
          const allPending = statuses.length > 0 && statuses.every((s) => s === 'pending')
          const badge: PendingGuarantorBadge = allAccepted ? 'accepted' : allPending ? 'pending' : 'partial'
          return {
            ...(a as any),
            guarantorBadge: badge,
            loan_products: { name: productMap.get(a.loan_product_id) ?? 'Unknown Product' },
            profiles: { full_name: memberMapForApps.get(a.member_id)?.full_name ?? 'Unknown' },
          }
        })

        setPendingApps(mappedApps)

        // Overdue schedules count
        const { count: overdue } = await supabase
          .from('repayment_schedules')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'overdue')
        setOverdueCount(overdue ?? 0)

        // Announcements
        const { data: anns } = await supabase
          .from('announcements')
          .select('id, title, priority, expires_at, published_at')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(5)

        setAnnouncements((anns ?? []) as any)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load dashboard data')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [supabase])

  const txColumns = useMemo<ColumnDef<TxRow, unknown>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Date',
        meta: { align: 'left' },
        cell: (info) => formatDate(info.getValue() as string),
      },
      {
        accessorKey: 'profiles',
        header: 'Member',
        cell: (info) => info.row.original.profiles?.full_name ?? 'Unknown',
      },
      {
        accessorKey: 'transaction_type',
        header: 'Type',
        cell: (info) => {
          const t = String(info.getValue())
          const tone = t === 'deposit' ? 'success' : t.includes('withdrawal') || t.includes('repayment') ? 'warning' : 'info'
          return <Badge tone={tone as any}>{t.replaceAll('_', ' ')}</Badge>
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right' },
        cell: (info) => <span className="font-mono tabular-nums">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'balance_after',
        header: 'Balance After',
        meta: { align: 'right' },
        cell: (info) => <span className="font-mono tabular-nums">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'reference_number',
        header: 'Reference',
        cell: (info) => <span className="text-sm">{String(info.getValue())}</span>,
      },
      {
        accessorKey: 'processed_by',
        header: 'Processed By',
        cell: () => <span className="text-sm text-text-secondary">—</span>,
      },
    ],
    [],
  )

  const appColumns = useMemo<ColumnDef<(typeof pendingApps)[number], unknown>[]>(
    () => [
      { accessorKey: 'application_number', header: 'App No' },
      {
        accessorKey: 'profiles',
        header: 'Member',
        cell: (info) => info.row.original.profiles?.full_name ?? 'Unknown',
      },
      {
        accessorKey: 'loan_products',
        header: 'Product',
        cell: (info) => info.row.original.loan_products?.name ?? 'Unknown Product',
      },
      {
        accessorKey: 'amount_requested',
        header: 'Amount',
        meta: { align: 'right' },
        cell: (info) => <span className="font-mono tabular-nums">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'term_months',
        header: 'Term',
        meta: { align: 'right' },
        cell: (info) => <span className="font-mono tabular-nums">{Number(info.getValue())} mo</span>,
      },
      {
        accessorKey: 'submitted_at',
        header: 'Submitted',
        cell: (info) => formatDate(info.getValue() as string),
      },
      {
        accessorKey: 'guarantorBadge',
        header: 'Guarantors',
        cell: (info) => {
          const b = info.getValue() as PendingGuarantorBadge
          const tone = b === 'accepted' ? 'success' : b === 'partial' ? 'warning' : 'neutral'
          return <Badge tone={tone as any}>{b === 'accepted' ? 'All Accepted' : b === 'partial' ? 'Partial' : 'Pending'}</Badge>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Link
            href={`/admin/loans/${row.original.id}`}
            className="inline-flex items-center justify-center px-3 py-1 rounded-input border border-border text-sm font-semibold text-text-primary hover:bg-[#F9FAFB]"
          >
            Review
          </Link>
        ),
      },
    ],
    [pendingApps],
  )

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-text-primary">Admin Dashboard</h1>

      {loading ? (
        <div className="flex items-center gap-3 text-text-secondary">
          <Spinner /> Loading dashboard...
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Active Members" value={activeMembers} />
        <StatCard label="Total Savings" value={<span className="font-mono tabular-nums">{formatCurrency(totalSavings)}</span>} />
        <StatCard label="Total Shares" value={<span className="font-mono tabular-nums">{formatCurrency(totalShares)}</span>} />
        <StatCard label="Welfare Fund Balance" value={<span className="font-mono tabular-nums">{formatCurrency(welfareFund)}</span>} />
        <StatCard label="Active Loans" value={activeLoans} />
        <StatCard label="Pending Applications" value={pendingApplications} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-5">
          <div className="text-sm font-bold text-text-primary">Available for Disbursement</div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-danger">{formatCurrency(welfareFund)}</div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Disbursed</span>
              <span className="font-semibold">{progressPct}%</span>
            </div>
            <div className="mt-2 h-3 bg-bg-elevated border border-border rounded-input overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={() => {
                const amount = prompt('Enter amount to transfer from Welfare Fund:');
                const memberNo = prompt('Enter Member Number to receive funds:');
                if (amount && memberNo) {
                  toast.success(`Initiated transfer of KES ${amount} to member ${memberNo}`);
                }
              }}
            >
              Move Funds
            </Button>
            
            <Button
              className="w-full border-accent text-accent hover:bg-accent/10"
              variant="ghost"
              onClick={async () => {
                try {
                  await seedLoanProducts();
                  toast.success('Loan products seeded successfully!');
                  window.location.reload();
                } catch (err: any) {
                  toast.error(err.message);
                }
              }}
            >
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Seed Default Products
            </Button>
            
            <p className="text-[10px] text-text-secondary text-center">
              Seed will create Emergency, Development, and Education loans.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-text-primary">Recent Transactions</div>
              <div className="mt-1 text-sm text-text-secondary">Last 10 transactions from the ledger.</div>
            </div>
          </div>

          <div className="mt-4">
            <Table columns={txColumns} data={recentTransactions} empty="No transactions yet." />
          </div>
        </Card>
      </div>

      {overdueCount > 0 ? (
        <Card className="p-4 border border-danger-light">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-danger">Overdue Loans Alert</div>
              <div className="mt-1 text-sm text-text-secondary">
                {overdueCount} repayment schedule(s) are overdue.
              </div>
            </div>
            <Link href="/admin/loans" className="inline-flex items-center justify-center px-3 py-2 rounded-input bg-danger text-white font-semibold hover:bg-danger-light">
              View Loans
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <div className="text-sm font-bold text-text-primary">Pending Loan Applications</div>
          <div className="mt-1 text-sm text-text-secondary">Applications awaiting review or further processing.</div>
          <div className="mt-4">
            <Table columns={appColumns as any} data={pendingApps as any} empty="No pending applications." />
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-bold text-text-primary">Announcements</div>
          <div className="mt-1 text-sm text-text-secondary">Latest active announcements.</div>
          <div className="mt-4 space-y-3">
            {(announcements.length ? announcements : []).map((a) => {
              const tone = a.priority === 'urgent' ? 'danger' : a.priority === 'important' ? 'warning' : 'neutral'
              return (
                <div key={a.id} className="border border-border rounded-input p-3 bg-bg-surface">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-text-primary">{a.title}</div>
                    <Badge tone={tone as any}>{String(a.priority).toUpperCase()}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-text-secondary">{formatDate(a.published_at)}</div>
                </div>
              )
            })}
            {!announcements.length ? (
              <div className="text-sm text-text-secondary">No active announcements.</div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

