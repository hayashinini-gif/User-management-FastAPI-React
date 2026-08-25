import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  /** One card per row may be emphasised — the deep-purple treatment. */
  emphasis?: boolean
}

export function StatCard({ label, value, hint, icon, emphasis = false }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-5 shadow-xs transition-colors',
        emphasis
          ? 'border-nav-900 bg-nav-900'
          : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            'text-2xs font-semibold uppercase tracking-[0.08em]',
            emphasis ? 'text-nav-fg' : 'text-muted',
          )}
        >
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-md',
              emphasis ? 'bg-white/10 text-white' : 'bg-brand-50 text-brand-600',
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <p
        className={cn(
          'nums mt-3 text-2xl font-semibold tracking-[-0.02em]',
          emphasis ? 'text-white' : 'text-ink',
        )}
      >
        {value}
      </p>

      {hint && (
        <p className={cn('mt-1.5 text-xs', emphasis ? 'text-nav-fg' : 'text-muted')}>{hint}</p>
      )}
    </div>
  )
}
