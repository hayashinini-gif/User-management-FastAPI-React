import { cn } from '../../lib/cn'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

function pageNumbers(current: number, last: number): (number | 'gap')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const out: (number | 'gap')[] = [1]
  const from = Math.max(2, current - 1)
  const to = Math.min(last - 1, current + 1)
  if (from > 2) out.push('gap')
  for (let i = from; i <= to; i++) out.push(i)
  if (to < last - 1) out.push('gap')
  out.push(last)
  return out
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  const arrow =
    'flex size-8 items-center justify-center rounded-md border border-line-strong bg-surface text-muted transition-colors hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer'

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:flex-row"
    >
      <p className="nums text-xs text-muted">
        Showing <span className="font-medium text-body">{first}</span>–
        <span className="font-medium text-body">{last}</span> of{' '}
        <span className="font-medium text-body">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={arrow}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon size={15} />
        </button>

        {pageNumbers(page, lastPage).map((n, i) =>
          n === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={cn(
                'nums size-8 cursor-pointer rounded-md text-xs font-medium transition-colors',
                n === page
                  ? 'bg-brand-600 text-white'
                  : 'text-body hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              {n}
            </button>
          ),
        )}

        <button
          type="button"
          className={arrow}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
          aria-label="Next page"
        >
          <ChevronRightIcon size={15} />
        </button>
      </div>
    </nav>
  )
}
