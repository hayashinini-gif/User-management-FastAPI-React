import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authAPI } from '../services/api'
import type { RegisterPayload } from '../services/api'
import { apiErrorMessage } from '../lib/format'
import type { User } from '../types/user'

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  /** True only while the stored session is being restored on first paint. */
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterPayload) => Promise<void>
  updateUserProfile: (user: User) => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser) as User)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const persistSession = useCallback((accessToken: string, userData: User) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null)
      try {
        const { data } = await authAPI.login(email, password)
        persistSession(data.access_token, data.user)
      } catch (err) {
        const message = apiErrorMessage(err, 'We could not sign you in. Please try again.')
        setError(message)
        throw new Error(message)
      }
    },
    [persistSession],
  )

  /**
   * The API's /auth/register returns the created user but no token, so we
   * sign in straight afterwards with the same credentials. That keeps the
   * "register → land on the dashboard" flow working without the backend
   * having to issue a token from the register endpoint.
   */
  const register = useCallback(
    async (payload: RegisterPayload) => {
      setError(null)
      try {
        await authAPI.register(payload)
      } catch (err) {
        const message = apiErrorMessage(err, 'We could not create your account.')
        setError(message)
        throw new Error(message)
      }

      try {
        const { data } = await authAPI.login(payload.email, payload.password)
        persistSession(data.access_token, data.user)
      } catch {
        const message = 'Your account was created, but automatic sign-in failed. Please sign in.'
        setError(message)
        throw new Error(message)
      }
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const updateUserProfile = useCallback((updated: User) => {
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!token && !!user,
      user,
      token,
      loading,
      error,
      login,
      logout,
      register,
      updateUserProfile,
      clearError,
    }),
    [token, user, loading, error, login, logout, register, updateUserProfile, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
