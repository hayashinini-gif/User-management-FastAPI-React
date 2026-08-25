import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { CloseIcon, LogOutIcon, ShieldIcon } from '../icons'
import { SECONDARY_NAV, primaryNav } from './navigation'

interface SidebarProps {
  isAdmin: boolean
  onLogout: () => void
  /** Mobile drawer state. Ignored on desktop, where the sidebar is permanent. */
  mobileOpen: boolean
  onCloseMobile: () => void
}

function NavItems({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate: () => void }) {
  const item = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150',
      'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
      active ? 'bg-nav-700 text-white' : 'text-nav-fg hover:bg-nav-800 hover:text-white',
    )

  return (
    <nav className="flex flex-1 flex-col gap-6 px-3" aria-label="Main">
      <ul className="flex flex-col gap-1">
        {primaryNav(isAdmin).map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} onClick={onNavigate} className={({ isActive }) => item(isActive)}>
              {link.icon}
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div>
        <div className="mb-2 border-t border-white/10" />
        <ul className="flex flex-col gap-1">
          {SECONDARY_NAV.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} onClick={onNavigate} className={({ isActive }) => item(isActive)}>
                {link.icon}
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

function Brand({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-16 items-center justify-between gap-2 px-5">
      <span className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-brand-500 text-white">
          <ShieldIcon size={17} />
        </span>
        <span className="text-base font-semibold tracking-[-0.01em] text-white">Console</span>
      </span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="flex size-8 cursor-pointer items-center justify-center rounded-md text-nav-fg transition-colors hover:bg-nav-800 hover:text-white lg:hidden"
        >
          <CloseIcon size={18} />
        </button>
      )}
    </div>
  )
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="p-3">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-nav-fg transition-colors hover:bg-nav-800 hover:text-white"
      >
        <LogOutIcon size={18} />
        Sign out
      </button>
    </div>
  )
}

export function Sidebar({ isAdmin, onLogout, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop: permanent rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-nav-900 lg:flex">
        <Brand />
        <NavItems isAdmin={isAdmin} onNavigate={() => {}} />
        <LogoutButton onLogout={onLogout} />
      </aside>

      {/* Mobile: drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-nav-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            className="animate-slide-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-nav-900 shadow-lg"
            aria-label="Navigation"
          >
            <Brand onClose={onCloseMobile} />
            <NavItems isAdmin={isAdmin} onNavigate={onCloseMobile} />
            <LogoutButton onLogout={onLogout} />
          </aside>
        </div>
      )}
    </>
  )
}
