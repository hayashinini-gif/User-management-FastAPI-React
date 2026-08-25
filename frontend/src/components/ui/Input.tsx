import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Field, controlClasses } from './Field'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  leadingIcon?: ReactNode
  trailing?: ReactNode
  containerClassName?: string
}

export function Input({
  label,
  hint,
  error,
  leadingIcon,
  trailing,
  containerClassName,
  className,
  required,
  ...rest
}: InputProps) {
  const id = useId()

  return (
    <Field
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {leadingIcon}
          </span>
        )}
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            controlClasses({ error: !!error, hasLeadingIcon: !!leadingIcon }),
            trailing && 'pr-10',
            className,
          )}
          {...rest}
        />
        {trailing && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
    </Field>
  )
}
