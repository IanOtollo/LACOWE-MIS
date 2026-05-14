'use client'

import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full border border-border rounded-input px-3 py-2 text-sm bg-white',
        'focus:outline-none focus:ring-0 focus:border-accent',
        className,
      )}
    />
  )
}

