'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { Table } from '@/components/ui/Table'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { PlusIcon } from 'lucide-react'
import { calculateLoan } from '@/lib/utils/loan-calculator'
import { TransactModal } from '@/components/member/TransactModal'
import type { ColumnDef } from '@tanstack/react-table'

type AccountRow = { id: string; account_type: string; account_number: string; account_name: string; balance: number; status: string; opened_at: string }
type TxRow = { id: string; created_at: string; transaction_type: string; description?: string | null; amount: number; balance_after: number; reference_number: string; payment_method?: string | null }
type LoanRow = { id: string; loan_number: string; outstanding_balance: number; monthly_repayment: number; total_paid: number; total_repayable: number; status: string; disbursed_at?: string | null; loan_products?: { name?: string | null } | null }
type AnnouncementRow = { id: string; title: string; content: string; priority: string; published_at: string; expires_at?: string | null }
type NotificationRow = { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string; action_url?: string | null }

function greetingByTime() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function MemberDashboardPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ id: string; last_name?: string | null; first_name?: string | null; member_number?: string | null } | null>(null)
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [activeLoan, setActiveLoan] = useState<LoanRow | null>(null)
  const [nextDue, setNextDue] = useState<{ due_date: string; total_due: number; status: string } | null>(null)
  const [recentTx, setRecentTx] = useState<TxRow[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isTransactOpen, setIsTransactOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let mounted = true
    async function run() {
      setLoading(true)
      try {
        const { data: authUser } = await supabase.auth.getUser()
        if (!authUser?.user?.id) throw new Error('No session user')
        const memberId = authUser.user.id

        const { data: prof } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, member_number')
          .eq('id', memberId)
          .single()

        if (!prof) throw new Error('Profile not found')
        if (!mounted) return
        setProfile({
          id: prof.id,
          first_name: prof.first_name,
          last_name: prof.last_name,
          member_number: prof.member_number,
        })

        const { data: accts } = await supabase
          .from('accounts')
          .select('id, account_type, account_number, account_name, balance, status, opened_at')
          .eq('member_id', prof.id)

        setAccounts((accts ?? []) as any)

        const { data: loans } = await supabase
          .from('loans')
          .select('id, loan_number, outstanding_balance, monthly_repayment, total_paid, total_repayable, status, disbursed_at')
          .eq('member_id', prof.id)
          .eq('status', 'active')
          .limit(1)

        const loan = (loans ?? [])[0] as LoanRow | undefined
        setActiveLoan(loan ?? null)

        if (loan) {
          const { data: schedules } = await supabase
            .from('repayment_schedules')
            .select('due_date, total_due, status')
            .eq('loan_id', loan.id)
            .order('due_date', { ascending: true })
            .limit(1)
          const s = (schedules ?? [])[0] as any
          if (s) setNextDue(s)
        }

        const { data: txs } = await supabase
          .from('transactions')
          .select('id, created_at, transaction_type, description, amount, balance_after, reference_number, payment_method')
          .eq('member_id', prof.id)
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentTx((txs ?? []) as any)

        const { data: anns } = await supabase
          .from('announcements')
          .select('id, title, content, priority, published_at, expires_at')
          .eq('is_active', true)
          .or('target_role.eq.all,target_role.eq.member')
          .order('published_at', { ascending: false })
          .limit(5)
        setAnnouncements((anns ?? []) as any)

        const { data: notes } = await supabase
          .from('notifications')
          .select('id, title, message, type, is_read, created_at, action_url')
          .eq('user_id', prof.id)
          .order('created_at', { ascending: false })
          .limit(10)
        setNotifications((notes ?? []) as any)
        setUnreadCount((notes ?? []).filter((n: any) => !n.is_read).length)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [supabase, refreshKey])

  const greeting = profile ? `Good ${greetingByTime()}, ${profile.last_name || profile.first_name || 'Member'}.` : ''

  const txColumns = useMemo<ColumnDef<TxRow, any>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: (info) => formatDate(info.getValue() as string),
      },
      {
        accessorKey: 'transaction_type',
        header: 'Type',
        cell: (info) => {
          const t = String(info.getValue() ?? '')
          const tone = t.includes('withdrawal') || t.includes('repayment') ? 'danger' : 'success'
          return (
            <Badge tone={tone as any}>
              {t.replaceAll('_', ' ')}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: (info) => String(info.getValue() ?? '—'),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right' },
        cell: (info) => (
          <span className="font-mono tabular-nums">
            {formatCurrency(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'balance_after',
        header: 'Balance After',
        meta: { align: 'right' },
        cell: (info) => (
          <span className="font-mono tabular-nums text-text-secondary">
            {formatCurrency(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'reference_number',
        header: 'Reference',
        cell: (info) => <span className="text-sm">{String(info.getValue() ?? '')}</span>,
      },
    ],
    [],
  )

  const repaidPct = activeLoan ? (activeLoan.total_repayable > 0 ? Math.round((activeLoan.total_paid / activeLoan.total_repayable) * 100) : 0) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Member Dashboard</h1>
          {greeting ? <div className="text-sm text-text-secondary mt-1">{greeting}</div> : null}
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsTransactOpen(true)}
            className="bg-success hover:bg-success/90 shadow-lg"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Deposit / Withdraw
          </Button>
          <Link href="/portal/loans/apply">
            <Button variant="secondary">
              Apply for Loan
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-text-secondary">
          <Spinner /> Loading...
        </div>
      ) : null}

      {!loading ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="text-sm font-bold text-text-primary">My Accounts</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map((a) => (
                  <div key={a.id} className="border border-border rounded-input p-4 bg-bg-surface">
                    <div className="flex items-center justify-between">
                      <Badge tone="neutral">{a.account_type.toUpperCase()}</Badge>
                      <div className="text-xs text-text-secondary">Status: {a.status}</div>
                    </div>
                    <div className="mt-3 font-semibold text-text-primary">{a.account_name}</div>
                    <div className="mt-1 text-xs text-text-secondary">Acct: {a.account_number}</div>
                    <div className="mt-3 text-2xl font-bold font-mono tabular-nums text-text-primary">{formatCurrency(a.balance)}</div>
                    <div className="mt-3">
                      <Link href="/portal/transactions" className="text-sm font-semibold text-accent hover:text-accent-hover">
                        View Transactions
                      </Link>
                    </div>
                  </div>
                ))}
                {!accounts.length ? <div className="text-sm text-text-secondary">No accounts found.</div> : null}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-bold text-text-primary">Active Loan</div>
              <div className="mt-4">
                {activeLoan ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-text-primary">{activeLoan.loan_number}</div>
                        <div className="mt-1 text-sm text-text-secondary">Outstanding Balance</div>
                      </div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-danger">{formatCurrency(activeLoan.outstanding_balance)}</div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm text-text-secondary">
                        <span>Next payment</span>
                        <span className="font-semibold">{nextDue ? `${formatCurrency(nextDue.total_due)} • ${formatDate(nextDue.due_date)}` : '—'}</span>
                      </div>
                      <div className="mt-3 h-3 bg-bg-elevated border border-border rounded-input overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${repaidPct}%` }} />
                      </div>
                      <div className="mt-2 text-xs text-text-secondary">
                        {repaidPct}% repaid
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link href="/portal/loans" className="inline-flex items-center justify-center px-3 py-2 rounded-input bg-accent text-white font-semibold hover:bg-accent-hover">
                        View Repayment Schedule
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-text-secondary">
                    You have no active loans. You are eligible to apply.
                    <div className="mt-4">
                      <Link href="/portal/loans/apply" className="inline-flex items-center justify-center px-3 py-2 rounded-input bg-accent text-white font-semibold hover:bg-accent-hover">
                        Apply for a Loan
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-text-primary">Recent Transactions</div>
                  <div className="mt-1 text-sm text-text-secondary">Last 5 ledger entries for your account.</div>
                </div>
                <Link href="/portal/transactions" className="text-sm font-semibold text-accent hover:text-accent-hover">
                  View all
                </Link>
              </div>
              <div className="mt-4">
                <Table columns={txColumns} data={recentTx as any} empty="No transactions found." />
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-bold text-text-primary">Announcements</div>
              <div className="mt-1 text-sm text-text-secondary">Active broadcasts from admin.</div>
              <div className="mt-4 space-y-3">
                {announcements.map((a) => {
                  const tone = a.priority === 'urgent' ? 'danger' : a.priority === 'important' ? 'warning' : 'neutral'
                  return (
                    <div key={a.id} className="border border-border rounded-input p-3 bg-bg-surface">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-text-primary">{a.title}</div>
                        <Badge tone={tone as any}>{a.priority.toUpperCase()}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-text-secondary">{formatDate(a.published_at)}</div>
                    </div>
                  )
                })}
                {!announcements.length ? <div className="text-sm text-text-secondary">No announcements.</div> : null}
              </div>

              <div className="mt-6">
                <div className="text-sm font-bold text-text-primary">Notifications</div>
                <div className="mt-1 text-sm text-text-secondary">Unread: {unreadCount}</div>
                <div className="mt-4 space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className={n.is_read ? 'border border-border rounded-input p-3 bg-bg-surface' : 'border border-border rounded-input p-3 bg-bg-elevated'}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-text-primary">{n.title}</div>
                          <div className="text-sm text-text-secondary mt-1 line-clamp-2">{n.message}</div>
                        </div>
                        <div className="text-xs text-text-muted">{formatDate(n.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  {!notifications.length ? <div className="text-sm text-text-secondary">No notifications.</div> : null}
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {profile && (
        <TransactModal 
          open={isTransactOpen}
          onClose={() => setIsTransactOpen(false)}
          accounts={accounts}
          memberId={profile.id}
          onSuccess={() => setRefreshKey((prev) => prev + 1)}
        />
      )}
    </div>
  )
}
