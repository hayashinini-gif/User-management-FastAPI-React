import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { InboxIcon } from '../icons'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon ?? <InboxIcon size={22} />}
      </span>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
