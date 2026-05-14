'use client'

import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-input transition-colors border border-transparent',
        size === 'sm' && 'px-3 py-1.5 text-xs font-bold',
        size === 'md' && 'px-4 py-2 text-sm font-semibold',
        size === 'lg' && 'px-6 py-3 text-base font-bold',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover',
        variant === 'secondary' && 'bg-bg-elevated text-text-primary hover:bg-[#E9EDF1] border-border-strong',
        variant === 'danger' && 'bg-danger text-white hover:bg-[#c91f1f]',
        variant === 'ghost' && 'bg-transparent text-text-primary hover:bg-[#F9FAFB] border-border-strong',
        isDisabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}

