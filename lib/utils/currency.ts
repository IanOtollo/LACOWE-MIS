export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'KES 0.00'

  return `KES ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
}

