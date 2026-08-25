import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { PAGE_TITLES } from './navigation'

/**
 * The signed-in shell: permanent purple rail on desktop, drawer on mobile,
 * one scrolling content column with a consistent max width and page padding.
 */
export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const isAdmin = user?.type === 'admin'
  const title = PAGE_TITLES[location.pathname] ?? 'Console'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar
        isAdmin={isAdmin}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="lg:pl-64">
        <Topbar
          title={title}
          user={user}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onLogout={handleLogout}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
