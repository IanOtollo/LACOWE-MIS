'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import {
  LayoutDashboard,
  Users,
  Wallet,
  HandCoins,
  FileText,
  History,
  Settings,
  LogOut,
  UserCircle2,
  Megaphone,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

type RoleName = 'admin' | 'member' | 'committee'

export function AdminSidebar({
  role,
  userName,
  memberNumber,
  isMobile = false,
}: {
  role: RoleName
  userName: string
  memberNumber?: string
  isMobile?: boolean
}) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const links: Array<{ label: string; href: string; icon: ReactNode }> = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Members', href: '/admin/members', icon: <Users className="h-4 w-4" /> },
    { label: 'Accounts', href: '/admin/accounts', icon: <Wallet className="h-4 w-4" /> },
    { label: 'Loans', href: '/admin/loans', icon: <HandCoins className="h-4 w-4" /> },
    { label: 'Transactions', href: '/admin/transactions', icon: <History className="h-4 w-4" /> },
    { label: 'Reports', href: '/admin/reports', icon: <FileText className="h-4 w-4" /> },
    { label: 'Announcements', href: '/admin/announcements', icon: <Megaphone className="h-4 w-4" /> },
    { label: 'Users', href: '/admin/users', icon: <UserCircle2 className="h-4 w-4" /> },
    { label: 'Profile & Settings', href: '/admin/profile', icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <aside className={cn(
      "w-[240px] border-r border-border h-screen flex-col sticky top-0 bg-bg-surface transition-all",
      isMobile ? "flex w-full border-none" : "hidden md:flex"
    )}>
      <div className="p-5 border-b border-border">
        <div className="text-sm font-bold text-text-primary tracking-wide">LACOWE</div>
        <div className="mt-1 text-[10px] uppercase tracking-widest font-semibold text-text-secondary">
          {role === 'committee' ? 'Committee' : 'Admin'} Portal
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((l) => {
          const isActive = pathname === l.href || (l.href !== '/admin/dashboard' && pathname.startsWith(l.href))
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
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
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
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
