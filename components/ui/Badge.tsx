'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Info, AlertTriangle, CheckCircle2, XCircle, Circle } from 'lucide-react'

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const toneToClasses: Record<Tone, string> = {
  info: 'bg-info-light text-info',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  neutral: 'bg-bg-elevated text-text-secondary',
}

const toneToIcon: Record<Tone, ReactNode> = {
  info: <Info className="h-3.5 w-3.5" />,
  success: <CheckCircle2 className="h-3.5 w-3.5" />,
  warning: <AlertTriangle className="h-3.5 w-3.5" />,
  danger: <XCircle className="h-3.5 w-3.5" />,
  neutral: <Circle className="h-3.5 w-3.5" />,
}

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-badge px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]',
        toneToClasses[tone],
        className,
      )}
    >
      <span className="inline-flex items-center">{toneToIcon[tone]}</span>
      <span className="leading-none">{children}</span>
    </span>
  )
}

