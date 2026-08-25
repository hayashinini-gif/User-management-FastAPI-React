import { cn } from '../../lib/cn'
import { CloseIcon, SearchIcon } from '../icons'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <label className="sr-only" htmlFor="ds-search">
        {label}
      </label>
      <SearchIcon
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        id="ds-search"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-10 w-full rounded-md border border-line-strong bg-surface pl-9 pr-9 text-sm text-ink',
          'placeholder:text-muted/70 outline-none transition-colors duration-150',
          'hover:border-muted/50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  )
}
