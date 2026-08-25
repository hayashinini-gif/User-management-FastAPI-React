import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ErrorState } from './ErrorState'
import { SkeletonTableRows } from './Skeleton'

export type SortDirection = 'asc' | 'desc'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Set to make the header clickable. Must match a column the API can sort on. */
  sortKey?: string
  /** Extra classes for the cell — use for alignment and width only. */
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  empty?: ReactNode
  footer?: ReactNode
  caption?: string
  /** Current sort, and the callback that changes it. */
  sortBy?: string
  sortOrder?: SortDirection
  onSortChange?: (key: string, order: SortDirection) => void
}

function SortIcon({ state }: { state: 'none' | 'asc' | 'desc' }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('shrink-0 transition-opacity', state === 'none' && 'opacity-0 group-hover:opacity-40')}
    >
      {state === 'desc' ? <path d="m6 9 6 6 6-6" /> : <path d="m6 15 6-6 6 6" />}
    </svg>
  )
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  empty,
  footer,
  caption,
  sortBy,
  sortOrder = 'asc',
  onSortChange,
}: DataTableProps<T>) {
  const showBody = !loading && !error && rows.length > 0

  const sortState = (col: Column<T>): 'none' | SortDirection =>
    col.sortKey && col.sortKey === sortBy ? sortOrder : 'none'

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="bg-surface-muted">
              {columns.map((col) => {
                const state = sortState(col)
                const sortable = !!col.sortKey && !!onSortChange
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      state === 'none' ? undefined : state === 'asc' ? 'ascending' : 'descending'
                    }
                    className={cn(
                      'px-5 py-3 text-2xs font-semibold uppercase tracking-[0.06em] text-muted',
                      col.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          onSortChange!(
                            col.sortKey!,
                            state === 'asc' ? 'desc' : state === 'desc' ? 'asc' : 'asc',
                          )
                        }
                        className={cn(
                          'group -mx-1 inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 uppercase tracking-[0.06em] transition-colors',
                          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
                          state === 'none' ? 'hover:text-ink' : 'text-brand-700',
                        )}
                      >
                        {col.header}
                        <SortIcon state={state} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {loading && <SkeletonTableRows rows={6} cols={columns.length} />}

            {showBody &&
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-t border-line transition-colors hover:bg-brand-50/40"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-3.5 align-middle', col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="border-t border-line">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="border-t border-line">{empty}</div>
      )}

      {showBody && footer}
    </div>
  )
}
