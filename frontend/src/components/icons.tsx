import type { SVGProps } from 'react'

/* A tiny hand-rolled icon set (~1KB) so the project stays free of an icon
   dependency. All icons share one grid, one stroke weight and inherit
   `currentColor`, which is what makes them look like a single family. */

export type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const DashboardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="8" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="11" width="7" height="10" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </Svg>
)

export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="9" cy="7" r="3.25" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.87" />
    <path d="M16 4.13a4 4 0 0 1 0 5.74" />
  </Svg>
)

export const ChartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21" />
    <path d="M7.5 15.5V12" />
    <path d="M12 15.5V7.5" />
    <path d="M16.5 15.5v-5" />
  </Svg>
)

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="7.5" r="3.75" />
    <path d="M4.5 20.5v-1a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v1" />
  </Svg>
)

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.47 1z" />
  </Svg>
)

export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.75 4.75 5.5v5.75c0 4.6 3 8.2 7.25 10 4.25-1.8 7.25-5.4 7.25-10V5.5z" />
    <path d="m9.25 12 2 2 3.5-3.75" />
  </Svg>
)

export const LogOutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 20.5h3a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2h-3" />
    <path d="m10 16 4-4-4-4" />
    <path d="M14 12H4" />
  </Svg>
)

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
  </Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
)

export const MoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5.5" r="1.25" fill="currentColor" />
    <circle cx="12" cy="12" r="1.25" fill="currentColor" />
    <circle cx="12" cy="18.5" r="1.25" fill="currentColor" />
  </Svg>
)

export const PencilIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4l10.5-10.5a2.5 2.5 0 0 0-3.54-3.54L4.5 16.5z" />
    <path d="m14.5 7 2.5 2.5" />
  </Svg>
)

export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.5h16" />
    <path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
    <path d="M6.5 6.5 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12.5" />
    <path d="M10.5 10.5v6M13.5 10.5v6" />
  </Svg>
)

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
)

export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Svg>
)

export const AlertTriangleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4M12 17h.01" />
  </Svg>
)

export const AlertCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </Svg>
)

export const InfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.75h.01" />
  </Svg>
)

export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.75" y="5" width="18.5" height="14" rx="2.5" />
    <path d="m3.5 7 7.4 5.3a2 2 0 0 0 2.2 0L20.5 7" />
  </Svg>
)

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.6 3.5h-.9A2.7 2.7 0 0 0 3 6.2c0 8.2 6.6 14.8 14.8 14.8a2.7 2.7 0 0 0 2.7-2.7v-.9a1.4 1.4 0 0 0-1-1.35l-3-.85a1.4 1.4 0 0 0-1.45.5l-.8 1a11.4 11.4 0 0 1-5-5l1-.8a1.4 1.4 0 0 0 .5-1.45l-.85-3A1.4 1.4 0 0 0 6.6 3.5Z" />
  </Svg>
)

export const MapPinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.75" />
  </Svg>
)

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.25" y="5" width="17.5" height="16" rx="2.5" />
    <path d="M3.25 9.5h17.5M8 3v4M16 3v4" />
  </Svg>
)

export const KeyIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7.75" cy="16.25" r="3.75" />
    <path d="m10.5 13.5 8-8" />
    <path d="m15.5 8.5 2.25 2.25" />
    <path d="m18 6 2.5 2.5" />
  </Svg>
)

export const UserCheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="8.5" cy="7.5" r="3.5" />
    <path d="m16.5 11 2 2 4-4.5" />
  </Svg>
)

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.75a4 4 0 0 1 8 0v2.75" />
  </Svg>
)

export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)

export const EyeOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.6 6a8.6 8.6 0 0 1 1.4-.12c6 0 9.5 6.12 9.5 6.12a16 16 0 0 1-2.55 3.3" />
    <path d="M6.4 7.7A15.6 15.6 0 0 0 2.5 12S6 18.12 12 18.12a8.9 8.9 0 0 0 3.7-.78" />
    <path d="M9.9 9.95a3 3 0 0 0 4.15 4.15" />
    <path d="m3.5 3.5 17 17" />
  </Svg>
)

export const FilterIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 5.5h17l-6.5 7.5v5.5l-4 2v-7.5z" />
  </Svg>
)

export const InboxIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 13.5h4l1.5 2.5h6l1.5-2.5h4" />
    <path d="M5.6 5h12.8a2 2 0 0 1 1.85 1.24l1.25 3.06a2 2 0 0 1 .15.76v7.44a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-7.44a2 2 0 0 1 .15-.76L3.9 6.24A2 2 0 0 1 5.6 5Z" />
  </Svg>
)

export const UserPlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="8.5" cy="7.5" r="3.5" />
    <path d="M19 8v6M22 11h-6" />
  </Svg>
)

export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 11.5A8 8 0 0 0 6.3 6.3L3.5 9" />
    <path d="M4 12.5a8 8 0 0 0 13.7 5.2l2.8-2.7" />
    <path d="M3.5 4.5V9H8M20.5 19.5V15H16" />
  </Svg>
)

export const SpinnerIcon = ({ size = 16, className, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={['animate-spin', className].filter(Boolean).join(' ')}
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
)
