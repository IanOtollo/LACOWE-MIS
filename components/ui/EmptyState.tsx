'use client'

import type { ReactNode } from 'react'
import { Card } from './Card'

export function EmptyState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-6">
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      {description ? <div className="mt-1 text-sm text-text-secondary">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}

