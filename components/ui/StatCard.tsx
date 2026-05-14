'use client'

import type { ReactNode } from 'react'
import { Card } from './Card'

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card className="p-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-text-secondary">
          {label}
        </div>
        <div className="mt-2 text-xl font-bold text-text-primary">{value}</div>
        {sub ? <div className="mt-1 text-sm text-text-secondary">{sub}</div> : null}
      </div>
      {icon ? <div className="text-text-secondary">{icon}</div> : null}
    </Card>
  )
}

