'use client'

import { useState, type ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange'
import { cn } from '@/lib/utils'

export function AdminClientLayout({ 
  children,
  role,
  userName,
  memberNumber
}: { 
  children: ReactNode,
  role: 'admin' | 'member' | 'committee',
  userName: string,
  memberNumber?: string
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-surface flex overflow-hidden">
      {/* Desktop Sidebar */}
      <AdminSidebar role={role} userName={userName} memberNumber={memberNumber} />

      {/* Mobile Sidebar Overlay */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm transition-all animate-in fade-in duration-300"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-[280px] bg-bg-surface z-[60] md:hidden transform transition-transform duration-300 ease-in-out border-r border-border",
        isMobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="h-full relative overflow-y-auto">
           {/* Re-using sidebar but with a close button or just the regular content */}
           <AdminSidebar role={role} userName={userName} memberNumber={memberNumber} isMobile />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminTopbar onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-20">
          <div className="max-w-7xl mx-auto w-full pb-12">
            {children}
          </div>
        </main>
      </div>
      <ForcePasswordChange />
    </div>
  )
}
