import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SpinnerIcon } from './icons'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'client'
}

/**
 * Route-level gate. This improves the experience — it is NOT the security
 * boundary. Every protected endpoint is authorised again on the server.
 */
export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <span className="flex items-center gap-2.5 text-sm text-muted">
          <SpinnerIcon size={18} />
          Checking your session…
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requiredRole && user?.type !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
