'use client'

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const px = size === 'sm' ? 16 : 20
  return (
    <span
      aria-label="Loading"
      className="inline-block rounded-full border-2 border-border-strong border-t-transparent animate-spin"
      style={{ width: px, height: px }}
    />
  )
}

