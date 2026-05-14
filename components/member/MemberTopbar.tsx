'use client'

import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function MemberTopbar({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border bg-bg-surface z-40">
      <div className="h-full flex items-center justify-between px-4">
        <Button
          type="button"
          variant="ghost"
          className="p-2 border border-border rounded-input"
          onClick={onOpenMobileNav}
        >
          <Menu className="h-4 w-4" />
          <span className="text-sm font-semibold">Menu</span>
        </Button>

        <div className="border border-border rounded-input px-3 py-1 flex items-center gap-2 text-text-secondary text-xs">
          <Bell className="h-3.5 w-3.5" />
          <span>Notifications</span>
        </div>
      </div>
    </header>
  )
}

