import { useState } from 'react'
import { cn } from '../../lib/cn'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSlice[]
  /** Shown in the middle of the ring. */
  centerLabel?: string
  className?: string
}

const RADIUS = 42
const STROKE = 16
/** Gap between segments, in the same 0–100 units as pathLength. */
const GAP = 1.2

export function DonutChart({ data, centerLabel = 'Total', className }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total <= 0) return null

  let cursor = 0
  const segments = data.map((slice, i) => {
    const pct = (slice.value / total) * 100
    const seg = { ...slice, pct, offset: cursor, index: i }
    cursor += pct
    return seg
  })

  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <div className="relative">
        <svg viewBox="0 0 100 100" className="size-40" role="img"
             aria-label={`${centerLabel}: ${total}. ${segments.map((s) => `${s.label} ${s.value}`).join(', ')}`}>
          {/* Track keeps the ring visible even with a single tiny segment. */}
          <circle
            cx="50" cy="50" r={RADIUS} fill="none"
            stroke="var(--color-line)" strokeWidth={STROKE}
          />
          <g transform="rotate(-90 50 50)">
            {segments.map((s) => (
              <circle
                key={s.label}
                cx="50" cy="50" r={RADIUS} fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                pathLength={100}
                strokeDasharray={`${Math.max(0, s.pct - GAP)} ${100 - Math.max(0, s.pct - GAP)}`}
                strokeDashoffset={-s.offset}
                className="transition-opacity duration-150"
                opacity={hovered === null || hovered === s.index ? 1 : 0.35}
                onMouseEnter={() => setHovered(s.index)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{`${s.label}: ${s.value} (${s.pct.toFixed(0)}%)`}</title>
              </circle>
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="nums text-2xl font-semibold tracking-[-0.02em] text-ink">
            {hovered === null ? total : segments[hovered].value}
          </span>
          <span className="mt-0.5 text-2xs font-medium uppercase tracking-[0.08em] text-muted">
            {hovered === null ? centerLabel : segments[hovered].label}
          </span>
        </div>
      </div>

      {/* Legend is always present — identity is never colour alone. */}
      <ul className="flex w-full flex-col gap-2">
        {segments.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between gap-3 text-xs"
            onMouseEnter={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              <span className="truncate font-medium text-body">{s.label}</span>
            </span>
            <span className="nums shrink-0 text-muted">
              <span className="font-medium text-ink">{s.value}</span>
              <span className="ml-1.5">{s.pct.toFixed(0)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
