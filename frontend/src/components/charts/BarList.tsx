import { cn } from '../../lib/cn'
import { SEQUENTIAL_HUE } from '../../lib/chartColors'

export interface BarItem {
  label: string
  value: number
}

interface BarListProps {
  data: BarItem[]
  /** Word for what the value counts, used in the accessible description. */
  unit?: string
  className?: string
}

/**
 * A ranked magnitude comparison. One hue, because there is one series —
 * colour here means "amount", not "identity", so no legend is needed.
 */
export function BarList({ data, unit = 'users', className }: BarListProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <ol className={cn('flex flex-col gap-3.5', className)}>
      {data.map((item) => (
        <li key={item.label} className="group">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-xs font-medium text-body">{item.label}</span>
            <span className="nums shrink-0 text-xs font-semibold text-ink">{item.value}</span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-canvas"
            role="img"
            aria-label={`${item.label}: ${item.value} ${unit}`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.max(3, (item.value / max) * 100)}%`,
                backgroundColor: SEQUENTIAL_HUE,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
