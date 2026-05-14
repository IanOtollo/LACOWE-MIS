export const generateReference = (prefix: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export const generateMemberNumber = (count: number): string =>
  `LCW-${String(count + 1).padStart(4, '0')}`

export const generateAccountNumber = (memberNumber: string, type: string): string => {
  const typeCode = type === 'savings' ? 'SAV' : type === 'shares' ? 'SHR' : 'FXD'
  return `${memberNumber}-${typeCode}`
}

export const generateReceiptNumber = (): string => {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `RCPT-${dateStr}-${random}`
}

