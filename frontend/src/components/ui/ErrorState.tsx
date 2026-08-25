import { cn } from '../../lib/cn'
import { AlertCircleIcon, RefreshIcon } from '../icons'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "That didn't load",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center px-6 py-14 text-center', className)}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <AlertCircleIcon size={22} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" icon={<RefreshIcon size={14} />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
