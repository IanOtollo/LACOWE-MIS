'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import {
  LayoutDashboard,
  Wallet,
  HandCoins,
  History,
  Bell,
  UserCircle2,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

export function MemberSidebar({
  role,
  userName,
  memberNumber,
}: {
  role: 'admin' | 'member' | 'committee'
  userName: string
  memberNumber?: string
}) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const links: Array<{ label: string; href: string; icon: ReactNode }> = [
    { label: 'Dashboard', href: '/portal/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'My Accounts', href: '/portal/accounts', icon: <Wallet className="h-4 w-4" /> },
    { label: 'My Loans', href: '/portal/loans', icon: <HandCoins className="h-4 w-4" /> },
    { label: 'Transactions', href: '/portal/transactions', icon: <History className="h-4 w-4" /> },
    { label: 'Guarantor Requests', href: '/portal/guarantor-requests', icon: <Bell className="h-4 w-4" /> },
    { label: 'My Profile', href: '/portal/profile', icon: <UserCircle2 className="h-4 w-4" /> },
  ]

  return (
    <aside className="hidden md:flex w-[240px] border-r border-border h-screen flex-col sticky top-0 bg-bg-surface">
      <div className="p-5 border-b border-border">
        <div className="text-sm font-bold text-text-primary tracking-wide">LACOWE</div>
        <div className="mt-1 text-[10px] uppercase tracking-widest font-semibold text-text-secondary">
          Member Portal
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((l) => {
          const isActive = pathname === l.href || (l.href !== '/portal/dashboard' && pathname.startsWith(l.href))
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-badge border-l-4 transition-colors',
                isActive
                  ? 'bg-accent text-white border-accent'
                  : 'bg-transparent text-text-secondary hover:bg-[#F9FAFB] hover:text-text-primary border-transparent',
              )}
            >
              {l.icon}
              <span className="text-sm font-semibold">{l.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
            {(userName || 'User').trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-text-primary truncate">{userName}</div>
            <div className="text-[11px] text-text-secondary truncate">{memberNumber || role}</div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-input text-sm font-semibold text-danger hover:bg-danger-light transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
