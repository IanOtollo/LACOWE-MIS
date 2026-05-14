'use client'

import type { ReactNode } from 'react'
import { Dialog } from '@headlessui/react'
import { cn } from '@/lib/utils'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={cn(
            'w-full max-w-lg rounded-input border border-border bg-bg-surface shadow-soft',
            className,
          )}
        >
          {title ? (
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">{title}</h2>
            </div>
          ) : null}
          <div className="p-4">{children}</div>
          {footer ? <div className="px-4 py-3 border-t border-border">{footer}</div> : null}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

