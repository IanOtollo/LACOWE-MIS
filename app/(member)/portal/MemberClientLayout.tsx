'use client'

import { useState, type ReactNode } from 'react'
import { MemberSidebar } from '@/components/member/MemberSidebar'
import { MemberTopbar } from '@/components/member/MemberTopbar'
import { cn } from '@/lib/utils'

export function MemberClientLayout({
  children,
  userName,
  memberNumber,
}: {
  children: ReactNode
  userName: string
  memberNumber?: string
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-surface flex overflow-hidden">
      {/* Desktop Sidebar */}
      <MemberSidebar userName={userName} memberNumber={memberNumber} />

      {/* Mobile overlay backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={cn(
        'fixed inset-y-0 left-0 w-[280px] bg-bg-surface z-[60] md:hidden transform transition-transform duration-300 ease-in-out border-r border-border',
        isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}>
        <div className="h-full overflow-y-auto">
          <MemberSidebar
            userName={userName}
            memberNumber={memberNumber}
            isMobile
            onClose={() => setIsMobileNavOpen(false)}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <MemberTopbar onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
          <div className="max-w-7xl mx-auto w-full pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
