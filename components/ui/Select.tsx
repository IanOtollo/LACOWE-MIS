'use client'

import { cn } from '@/lib/utils'
import type { SelectHTMLAttributes } from 'react'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full border border-border rounded-input px-3 py-2 text-sm bg-white',
        'focus:outline-none focus:ring-0 focus:border-accent',
        className,
      )}
    />
  )
}

