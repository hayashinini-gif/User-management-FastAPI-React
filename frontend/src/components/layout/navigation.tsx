import type { ReactNode } from 'react'
import { DashboardIcon, KeyIcon, SettingsIcon, UserIcon, UsersIcon } from '../icons'

export interface NavLinkDef {
  to: string
  label: string
  icon: ReactNode
}

/**
 * Navigation adapts to what the person can actually do: an admin's
 * "Dashboard" is the fleet-wide overview, a client's is their own account.
 *
 * Hiding a link is a UX decision, NOT a security boundary — every admin
 * endpoint is authorised again on the server.
 */
export function primaryNav(isAdmin: boolean): NavLinkDef[] {
  if (isAdmin) {
    return [
      { to: '/admin', label: 'Dashboard', icon: <DashboardIcon size={18} /> },
      { to: '/users', label: 'Users', icon: <UsersIcon size={18} /> },
      { to: '/roles', label: 'Roles & Permissions', icon: <KeyIcon size={18} /> },
    ]
  }
  return [{ to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon size={18} /> }]
}

export const SECONDARY_NAV: NavLinkDef[] = [
  { to: '/profile', label: 'My Profile', icon: <UserIcon size={18} /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
]

/** The topbar owns the page's <h1>, so titles live here. */
export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/admin': 'Dashboard',
  '/users': 'Users',
  '/roles': 'Roles & Permissions',
  '/profile': 'My Profile',
  '/settings': 'Settings',
}
