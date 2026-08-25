import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon } from '../icons'

export type AlertVariant = 'success' | 'info' | 'warning' | 'error'

const STYLES: Record<AlertVariant, { box: string; icon: ReactNode }> = {
  success: {
    box: 'bg-success-50 border-success-200 text-success-700',
    icon: <CheckCircleIcon size={16} />,
  },
  info: { box: 'bg-brand-50 border-brand-200 text-brand-700', icon: <InfoIcon size={16} /> },
  warning: {
    box: 'bg-warning-50 border-warning-200 text-warning-700',
    icon: <AlertTriangleIcon size={16} />,
  },
  error: {
    box: 'bg-danger-50 border-danger-200 text-danger-700',
    icon: <AlertCircleIcon size={16} />,
  },
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const style = STYLES[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-2.5 rounded-md border px-3.5 py-3 text-xs', style.box, className)}
    >
      <span className="mt-px shrink-0">{style.icon}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'leading-relaxed')}>{children}</div>}
      </div>
    </div>
  )
}
