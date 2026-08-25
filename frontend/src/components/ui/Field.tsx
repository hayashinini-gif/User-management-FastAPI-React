import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface FieldProps {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}

/**
 * The shared label / hint / error wrapper. Every form control uses it, which
 * is what keeps vertical rhythm and error styling identical across the app.
 */
export function Field({ id, label, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-danger-600" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {children}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Shared control skin so input / select / textarea can never drift apart. */
export function controlClasses(opts: { error?: boolean; hasLeadingIcon?: boolean } = {}) {
  return cn(
    'h-10 w-full rounded-md border bg-surface text-sm text-ink',
    'placeholder:text-muted/70 transition-colors duration-150 outline-none',
    'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted',
    opts.hasLeadingIcon ? 'pl-9 pr-3' : 'px-3',
    opts.error
      ? 'border-danger-600 focus:border-danger-600 focus:ring-2 focus:ring-danger-600/20'
      : 'border-line-strong hover:border-muted/50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
  )
}
