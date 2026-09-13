import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { usersAPI } from '../../services/api'
import type { FilterSuggestion, UserSortKey } from '../../types/user'
import { cn } from '../../lib/cn'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { CloseIcon, SearchIcon } from '../icons'

const EXAMPLE = 'admins named Ahmad, newest first'
const MIN_LENGTH = 2
const MAX_LENGTH = 200   // same as FilterQueryRequest on the server

const ROLE_LABEL: Record<string, string> = { admin: 'Admins', client: 'Clients' }
const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  deactivated: 'Deactivated',
  all: 'All statuses',
}
const SORT_LABEL: Record<UserSortKey, string> = {
  id: 'ID',
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Email',
  city: 'City',
  age: 'Age',
  type: 'Role',
  created_at: 'Created',
  updated_at: 'Updated',
}

interface NaturalLanguageFilterProps {
  onApply: (suggestion: FilterSuggestion) => void
}

/** Human-readable description of what the AI actually set. */
function summarize(s: FilterSuggestion): string[] {
  const parts: string[] = []
  if (s.search) parts.push(`Search “${s.search}”`)
  if (s.type) parts.push(`Role: ${ROLE_LABEL[s.type] ?? s.type}`)
  if (s.status) parts.push(`Status: ${STATUS_LABEL[s.status] ?? s.status}`)
  if (s.sort_by) {
    parts.push(`Sort: ${SORT_LABEL[s.sort_by]} ${s.sort_order === 'desc' ? '↓' : '↑'}`)
  }
  return parts
}

/**
 * Each failure asks the admin for something different, so they get different
 * messages. We branch on status code rather than showing the server's
 * `detail`, because FastAPI validation errors arrive as an array of objects.
 */
function messageFor(err: unknown): string {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined
  switch (status) {
    case 422:
      return "I couldn't turn that into filters. Try naming a role, a status, or a person's name."
    case 429:
      return 'Too many requests in a row. Wait a moment, then try again.'
    case 503:
      return 'The AI is unavailable right now — the filters below still work.'
    default:
      return 'Something went wrong interpreting that. The filters below still work.'
  }
}

export function NaturalLanguageFilter({ onApply }: NaturalLanguageFilterProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FilterSuggestion | null>(null)

  const tooShort = query.trim().length < MIN_LENGTH
  const applied = result ? summarize(result) : []

  const reset = () => {
    setQuery('')
    setError(null)
    setResult(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (tooShort || loading) return

    setLoading(true)
    setError(null)
    setResult(null)          // clear the previous interpretation immediately
    try {
      const { data } = await usersAPI.interpretFilters(query.trim())
      setResult(data)
      onApply(data)
    
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label className="sr-only" htmlFor="nl-filter">
            Describe the users you want to see
          </label>
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="nl-filter"
            type="text"
            value={query}
            maxLength={MAX_LENGTH}
            disabled={loading}
            placeholder={`Try: “${EXAMPLE}”`}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              'h-10 w-full rounded-md border border-line-strong bg-surface pl-9 pr-9 text-sm text-ink',
              'placeholder:text-muted/70 outline-none transition-colors duration-150',
              'hover:border-muted/50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
              'disabled:opacity-60',
            )}
          />
          {query && !loading && (
            <button
              type="button"
              aria-label="Clear the request"
              onClick={reset}
              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        <Button type="submit" loading={loading} disabled={tooShort}>
          {loading ? 'Interpreting…' : 'Ask AI'}
        </Button>
      </form>

      {/* "warning", not "error": the page works perfectly without the AI. */}
      {error && <Alert variant="warning">{error}</Alert>}

      {/* Past tense on purpose — this describes the request, not the live
          filter state, so it stays true after a manual change below. */}
      {applied.length > 0 && (
        <p className="text-xs text-muted" aria-live="polite">
          <span className="font-medium text-ink">Interpreted as</span>{' '}
          {applied.join(' · ')}
        </p>
      )}

      {/* The model told us the request asked for something this API can't do. */}
      {result && result.unsupported.length > 0 && (
        <Alert variant="warning" title="Part of that isn’t supported">
          This page can’t do {result.unsupported.join(', ')}.
          {applied.length > 0
            ? ' The rest of your request was applied.'
            : ' Nothing was changed.'}
        </Alert>
      )}

      {/* Understood, but no filters in it — e.g. "show me the users". */}
      {result && applied.length === 0 && result.unsupported.length === 0 && (
        <Alert variant="info">
          I didn’t find any filters in that. Try naming a role, a status, or a person’s name.
        </Alert>
      )}
    </div>
  )
}