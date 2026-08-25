import type { ReactNode } from 'react'
import type { Toast as ToastData } from '../context/ToastContext'
import { cn } from '../lib/cn'
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, CloseIcon, InfoIcon } from './icons'

const STYLES: Record<ToastData['type'], { box: string; icon: ReactNode }> = {
  success: {
    box: 'border-success-200 bg-success-50 text-success-700',
    icon: <CheckCircleIcon size={16} />,
  },
  error: {
    box: 'border-danger-200 bg-danger-50 text-danger-700',
    icon: <AlertCircleIcon size={16} />,
  },
  warning: {
    box: 'border-warning-200 bg-warning-50 text-warning-700',
    icon: <AlertTriangleIcon size={16} />,
  },
  info: { box: 'border-brand-200 bg-brand-50 text-brand-700', icon: <InfoIcon size={16} /> },
}

interface ToastProps {
  toast: ToastData
  onClose: (id: string) => void
}

export const Toast = ({ toast, onClose }: ToastProps) => {
  const style = STYLES[toast.type] ?? STYLES.info

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'animate-slide-in pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-md',
        style.box,
      )}
    >
      <span className="mt-px shrink-0">{style.icon}</span>
      <p className="min-w-0 flex-1 text-xs font-medium leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  )
}
