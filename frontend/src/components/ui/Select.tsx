import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { ChevronDownIcon } from '../icons'
import { Field, controlClasses } from './Field'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  containerClassName?: string
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  containerClassName,
  className,
  required,
  ...rest
}: SelectProps) {
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
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            controlClasses({ error: !!error }),
            'cursor-pointer appearance-none pr-9',
            className,
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </Field>
  )
}
