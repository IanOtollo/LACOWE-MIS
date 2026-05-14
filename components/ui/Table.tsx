'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type AlignMeta = { align?: 'left' | 'right' | 'center' }

export function Table<T>({
  columns,
  data,
  className,
  empty,
}: {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  className?: string
  empty?: ReactNode
}) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!data.length) {
    return (
      <div className={cn('w-full rounded-card border border-border bg-bg-surface', className)}>
        <div className="p-6 text-sm text-text-secondary">{empty ?? 'No records found.'}</div>
      </div>
    )
  }

  return (
    <div className={cn('w-full rounded-card border border-border bg-bg-surface overflow-hidden', className)}>
      <table className="w-full border-collapse">
        <thead className="bg-bg-elevated">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      'text-left text-[11px] uppercase font-semibold text-text-secondary tracking-[0.05em] border-b border-border px-3 py-2',
                      (header.column.columnDef.meta as AlignMeta | undefined)?.align === 'right' && 'text-right',
                      (header.column.columnDef.meta as AlignMeta | undefined)?.align === 'center' && 'text-center',
                      canSort && 'cursor-pointer select-none',
                    )}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort ? (
                        <span className="text-[10px] text-text-muted">
                          {sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : ''}
                        </span>
                      ) : null}
                    </div>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border hover:bg-[#F9FAFB]"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    'px-3 py-2 text-sm text-text-primary border-b border-border last:border-b-0',
                    (cell.column.columnDef.meta as AlignMeta | undefined)?.align === 'right' && 'text-right',
                    (cell.column.columnDef.meta as AlignMeta | undefined)?.align === 'center' && 'text-center',
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

