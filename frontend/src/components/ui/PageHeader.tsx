import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PageHeaderProps {
  /** Optional. The topbar already carries the page's <h1>; pass a title only
   *  when the page wants an extra heading of its own (e.g. a greeting). */
  title?: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {title && (
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        )}
        {description && (
          <p className={cn('text-sm text-muted', title && 'mt-1')}>{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
