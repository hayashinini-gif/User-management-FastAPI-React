import { cn } from '../../lib/cn'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<AvatarSize, string> = {
  sm: 'size-7 text-2xs',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
}

/* Tints stay inside the lavender family. Green and amber are reserved for
   success and warning states, so an avatar can never look like a status.
   The tint is derived from the name, and is decoration only. */
const TINTS = [
  'bg-brand-100 text-brand-700',
  'bg-brand-50 text-brand-800',
  'bg-brand-200 text-brand-900',
  'bg-canvas text-nav-700',
]

function tintFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return TINTS[hash % TINTS.length]
}

interface AvatarProps {
  initials: string
  name?: string
  size?: AvatarSize
  className?: string
}

export function Avatar({ initials, name, size = 'md', className }: AvatarProps) {
  return (
    <span
      title={name}
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold uppercase',
        SIZES[size],
        tintFor(name ?? initials),
        className,
      )}
    >
      {initials}
    </span>
  )
}
