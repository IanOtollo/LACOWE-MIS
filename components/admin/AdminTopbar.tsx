'use client'

import { Menu, Bell, Search, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export function AdminTopbar({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  const showNotifications = () => {
    toast.info('No new notifications', {
      description: 'You are all caught up!',
    })
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[240px] h-14 border-b border-border bg-bg-surface/80 backdrop-blur-md z-40 transition-all">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            className="md:hidden p-2 border border-border rounded-input"
            onClick={onOpenMobileNav}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="hidden md:flex items-center gap-2 text-text-secondary text-sm font-medium">
            <Search className="h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-sm w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-text-secondary"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-xs">Support</span>
          </Button>
          
          <button
            onClick={showNotifications}
            className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-full transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-bg-surface" />
          </button>
          
          <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
          
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-bg-elevated rounded-badge border border-border">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">System Online</span>
          </div>
        </div>
      </div>
    </header>
  )
}
