import { useNavigate } from 'react-router-dom'
import type { User } from '../../types/user'
import { fullName, initials } from '../../lib/format'
import { Avatar } from '../ui/Avatar'
import { DropdownMenu } from '../ui/DropdownMenu'
import { ChevronDownIcon, LogOutIcon, MenuIcon, SettingsIcon, UserIcon } from '../icons'

interface TopbarProps {
  title: string
  user: User | null
  onOpenMobileNav: () => void
  onLogout: () => void
}

export function Topbar({ title, user, onOpenMobileNav, onLogout }: TopbarProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink lg:hidden"
        >
          <MenuIcon size={19} />
        </button>
        <h1 className="truncate text-base font-semibold text-ink">{title}</h1>
      </div>

      <DropdownMenu
        label="Account menu"
        items={[
          { label: 'My profile', icon: <UserIcon size={14} />, onSelect: () => navigate('/profile') },
          { label: 'Settings', icon: <SettingsIcon size={14} />, onSelect: () => navigate('/settings') },
          { label: 'Sign out', icon: <LogOutIcon size={14} />, onSelect: onLogout, destructive: true },
        ]}
        trigger={
          <span className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-canvas">
            <Avatar initials={initials(user)} name={fullName(user)} size="md" />
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block truncate text-xs font-semibold text-ink">
                {fullName(user) || 'Account'}
              </span>
              <span className="block truncate text-2xs text-muted">{user?.email}</span>
            </span>
            <ChevronDownIcon size={15} className="shrink-0 text-muted" />
          </span>
        }
      />
    </header>
  )
}
