'use client'

import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-card border border-border bg-bg-surface shadow-soft',
        className,
      )}
    />
  )
}

