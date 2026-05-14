'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  FileText, 
  HandCoins, 
  BarChart3, 
  History, 
  Settings, 
  LogOut,
  UserCircle,
  Bell,
  ShieldCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

interface SidebarProps {
  role: 'admin' | 'member' | 'committee';
  userName: string;
  memberNumber?: string;
}

export const Sidebar = ({ role, userName, memberNumber }: SidebarProps) => {
  const pathname = usePathname();
  const supabase = createClient();

  const adminLinks: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Members', href: '/admin/members', icon: Users },
    { label: 'Accounts', href: '/admin/accounts', icon: Wallet },
    { label: 'Loans', href: '/admin/loans', icon: HandCoins },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const memberLinks: NavItem[] = [
    { label: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', href: '/member/profile', icon: UserCircle },
    { label: 'My Account', href: '/member/account', icon: Wallet },
    { label: 'My Loans', href: '/member/loans', icon: HandCoins },
    { label: 'Guarantor Requests', href: '/member/guarantor-requests', icon: Bell },
  ];

  const committeeLinks: NavItem[] = [
    { label: 'Dashboard', href: '/committee/dashboard', icon: LayoutDashboard },
    { label: 'Loan Reviews', href: '/committee/loans', icon: HandCoins },
    { label: 'Financial Reports', href: '/committee/reports', icon: BarChart3 },
  ];

  const links = role === 'admin' ? adminLinks : role === 'committee' ? committeeLinks : memberLinks;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 border-r border-border h-screen bg-white flex flex-col sticky top-0">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-serif tracking-tight">LACOWE</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">
          {role} Portal
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-DEFAULT transition-colors',
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-[#4B5563] hover:bg-[#F9FAFB] hover:text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border bg-[#FAFAFA]">
        <div className="flex items-center gap-3 px-3 py-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary truncate">{userName}</p>
            <p className="text-[10px] text-gray-500 truncate">{memberNumber || role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-error hover:bg-red-50 rounded-DEFAULT transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
