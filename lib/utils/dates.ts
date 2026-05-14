import { format } from 'date-fns'

export const formatDate = (value: Date | string | null | undefined): string => {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '-'
  return format(date, 'dd MMM yyyy')
}

