import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ShieldIcon, UserIcon } from '../icons'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-canvas text-body border-line-strong',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
}

interface BadgeProps {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-2xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/** Role is communicated by icon + word + colour — never colour alone. */
export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const isAdmin = role === 'admin'
  return (
    <Badge
      tone={isAdmin ? 'brand' : 'neutral'}
      icon={isAdmin ? <ShieldIcon size={12} /> : <UserIcon size={12} />}
      className={className}
    >
      {isAdmin ? 'Admin' : 'Client'}
    </Badge>
  )
}

/** "Deactivated" everywhere, never "Deleted" — nothing is actually erased. */
export function StatusBadge({ active, className }: { active: boolean; className?: string }) {
  return (
    <Badge tone={active ? 'success' : 'neutral'} className={className}>
      <span
        className={cn('size-1.5 rounded-full', active ? 'bg-success-600' : 'bg-muted')}
        aria-hidden="true"
      />
      {active ? 'Active' : 'Deactivated'}
    </Badge>
  )
}
