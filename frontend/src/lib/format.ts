import type { User } from '../types/user'

export function fullName(user?: Pick<User, 'first_name' | 'last_name'> | null): string {
  if (!user) return ''
  return `${user.first_name} ${user.last_name}`.trim()
}

export function initials(user?: Pick<User, 'first_name' | 'last_name'> | null): string {
  if (!user) return '?'
  const a = user.first_name?.[0] ?? ''
  const b = user.last_name?.[0] ?? ''
  return (a + b).toUpperCase() || '?'
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "—" for null/undefined so tables never render an empty cell. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

/**
 * Turns any API failure into a short sentence a person can act on.
 * Never leaks stack traces, SQL, or raw validation objects.
 */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const err = error as {
    response?: { status?: number; data?: { detail?: unknown } }
    code?: string
    message?: string
  }

  if (!err?.response) {
    if (err?.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check that the API is running and try again.'
    }
    return fallback
  }

  const { status, data } = err.response
  const detail = data?.detail

  // Never surface a server-side failure message to the user. FastAPI's default
  // 500 body is {"detail": "Internal Server Error"}, which explains nothing and
  // hints at internals.
  if (status && status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.'
  }

  // FastAPI validation errors arrive as a list of {loc, msg, type}
  if (Array.isArray(detail)) {
    const first = detail[0] as { loc?: unknown[]; msg?: string } | undefined
    if (first?.msg) {
      const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : ''
      const label = field ? field.replace(/_/g, ' ') : 'One of the fields'
      return `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${first.msg.replace(/^Value error, /, '')}`
    }
  }

  if (typeof detail === 'string' && detail.trim()) return detail

  switch (status) {
    case 400:
      return 'That request could not be completed. Please check the details and try again.'
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return "You don't have permission to do that."
    case 404:
      return 'We could not find what you were looking for.'
    case 409:
      return 'That already exists. Try a different value.'
    case 422:
      return 'Some of the information is not valid. Please review the form.'
    default:
      return status && status >= 500
        ? 'The server ran into a problem. Please try again in a moment.'
        : fallback
  }
}
