'use client'

import { Button } from './Button'

export function Pagination({
  pageIndex,
  pageCount,
  onPageChange,
}: {
  pageIndex: number
  pageCount: number
  onPageChange: (next: number) => void
}) {
  const canPrev = pageIndex > 0
  const canNext = pageIndex < pageCount - 1

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="text-sm text-text-secondary">
        Page <span className="font-semibold text-text-primary">{pageIndex + 1}</span> of{' '}
        <span className="font-semibold text-text-primary">{pageCount || 1}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={!canPrev}
          onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!canNext}
          onClick={() => onPageChange(Math.min(pageCount - 1, pageIndex + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

