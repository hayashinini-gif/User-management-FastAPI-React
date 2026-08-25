import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { statsAPI, usersAPI } from '../services/api'
import { apiErrorMessage, formatDate, fullName, initials } from '../lib/format'
import { useDebounced } from '../lib/useDebounced'
import { cn } from '../lib/cn'
import type { SortOrder, User, UserRole, UserSortKey, UserStatusFilter } from '../types/user'
import { Avatar } from '../components/ui/Avatar'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { Column } from '../components/ui/DataTable'
import { DataTable } from '../components/ui/DataTable'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { StatCard } from '../components/ui/StatCard'
import { KeyIcon, ShieldIcon, UserCheckIcon, UserIcon, UsersIcon } from '../components/icons'

const PAGE_SIZE = 10
const ALL = 'all'

/**
 * Two explicit controls per row — role and status — because that is the whole
 * job of this page. The Users page keeps the hidden-menu treatment; here the
 * decisions are the content.
 */
function RoleSwitch({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled?: boolean
  onChange: (role: UserRole) => void
}) {
  const options: { role: UserRole; label: string }[] = [
    { role: 'client', label: 'Client' },
    { role: 'admin', label: 'Admin' },
  ]

  return (
    <div
      role="group"
      aria-label="Role"
      className={cn(
        'inline-flex rounded-md border border-line-strong bg-surface-muted p-0.5',
        disabled && 'opacity-55',
      )}
    >
      {options.map(({ role, label }) => {
        const selected = value === role
        return (
          <button
            key={role}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => !selected && onChange(role)}
            className={cn(
              'h-7 rounded-sm px-2.5 text-2xs font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              selected ? 'bg-brand-600 text-white shadow-xs' : 'text-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export const RolesPermissions = () => {
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()

  const [rows, setRows] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [counts, setCounts] = useState({ admins: 0, clients: 0, deactivated: 0 })

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search)
  const [role, setRole] = useState(ALL)
  const [status, setStatus] = useState<UserStatusFilter>('all')
  const [sortBy, setSortBy] = useState<UserSortKey>('type')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [page, setPage] = useState(1)

  const [roleTarget, setRoleTarget] = useState<{ user: User; next: UserRole } | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const { data } = await usersAPI.list({
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        type: role === ALL ? undefined : role,
        status,
        sortBy,
        sortOrder,
      })
      if (id !== requestId.current) return
      setRows(data.items)
      setTotal(data.total)
    } catch (err) {
      if (id !== requestId.current) return
      setError(apiErrorMessage(err, 'We could not load the access list.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [page, debouncedSearch, role, status, sortBy, sortOrder])

  /* The summary counts describe the whole user base, not the current page, so
     they come from their own requests: the role split from the statistics
     endpoint, and the deactivated count as the difference between every
     account and the active ones (limit=1 — we only want the totals). */
  const loadCounts = useCallback(async () => {
    try {
      const [dist, all, active] = await Promise.all([
        statsAPI.userDistribution(),
        usersAPI.list({ limit: 1, status: 'all' }),
        usersAPI.list({ limit: 1, status: 'active' }),
      ])
      setCounts({
        admins: dist.data.distribution.find((d) => d.type === 'admin')?.count ?? 0,
        clients: dist.data.distribution.find((d) => d.type === 'client')?.count ?? 0,
        deactivated: all.data.total - active.data.total,
      })
    } catch {
      // The table is the page; if only the summary fails, leave it at zero
      // rather than blocking everything else.
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadCounts()
  }, [loadCounts])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, role, status, sortBy, sortOrder])

  const refreshAll = async () => {
    await Promise.all([load(), loadCounts()])
  }

  const filtersActive = search.trim() !== '' || role !== ALL || status !== 'all'

  const resetFilters = () => {
    setSearch('')
    setRole(ALL)
    setStatus('all')
  }

  const applyRoleChange = async () => {
    if (!roleTarget) return
    setBusy(true)
    setActionError(null)
    try {
      await usersAPI.changeRole(roleTarget.user.id, roleTarget.next)
      addToast(
        `${fullName(roleTarget.user)} is now ${roleTarget.next === 'admin' ? 'an admin' : 'a client'}.`,
        'success',
      )
      setRoleTarget(null)
      await refreshAll()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'We could not change this role.'))
    } finally {
      setBusy(false)
    }
  }

  const applyDeactivate = async () => {
    if (!deactivateTarget) return
    setBusy(true)
    setActionError(null)
    try {
      await usersAPI.softDelete(deactivateTarget.id)
      addToast(`${fullName(deactivateTarget)} has been deactivated.`, 'success')
      setDeactivateTarget(null)
      await refreshAll()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'We could not deactivate this account.'))
    } finally {
      setBusy(false)
    }
  }

  /* Reactivating is not destructive and is trivially undone, so it happens on
     click. Only the one-way action gets a confirmation step. */
  const reactivate = async (user: User) => {
    setRestoringId(user.id)
    try {
      await usersAPI.restore(user.id)
      addToast(`${fullName(user)} can sign in again.`, 'success')
      await refreshAll()
    } catch (err) {
      addToast(apiErrorMessage(err, 'We could not reactivate this account.'), 'error')
    } finally {
      setRestoringId(null)
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      sortKey: 'first_name',
      render: (u) => (
        <div className={cn('flex items-center gap-3', u.is_deleted && 'opacity-60')}>
          <Avatar initials={initials(u)} name={fullName(u)} />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">
              {fullName(u)}
              {u.id === currentUser?.id && (
                <span className="ml-1.5 font-normal text-muted">(you)</span>
              )}
            </p>
            <p className="truncate text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortKey: 'type',
      render: (u) => (
        <RoleSwitch
          value={u.type}
          disabled={u.id === currentUser?.id || u.is_deleted}
          onChange={(next) => setRoleTarget({ user: u, next })}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusBadge active={!u.is_deleted} />,
    },
    {
      key: 'changed',
      header: 'Last change',
      sortKey: 'updated_at',
      render: (u) => <span className="nums text-xs text-muted">{formatDate(u.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (u) =>
        u.id === currentUser?.id ? (
          <span className="text-xs text-muted">—</span>
        ) : u.is_deleted ? (
          <Button
            variant="outline"
            size="sm"
            icon={<UserCheckIcon size={14} />}
            loading={restoringId === u.id}
            onClick={() => void reactivate(u)}
          >
            Reactivate
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"
            onClick={() => setDeactivateTarget(u)}
          >
            Deactivate
          </Button>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader description="Who can manage the system, and whose account is active." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          emphasis
          label="Administrators"
          value={counts.admins}
          hint="Can manage every account"
          icon={<ShieldIcon size={16} />}
        />
        <StatCard
          label="Clients"
          value={counts.clients}
          hint="Standard access only"
          icon={<UserIcon size={16} />}
        />
        <StatCard
          label="Deactivated"
          value={counts.deactivated}
          hint="Cannot sign in"
          icon={<UsersIcon size={16} />}
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-sm lg:flex-1"
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email…"
          />
          <div className="grid grid-cols-2 gap-3 lg:w-96">
            <Select
              label="Role"
              containerClassName="[&>label]:sr-only"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: ALL, label: 'All roles' },
                { value: 'admin', label: 'Admins' },
                { value: 'client', label: 'Clients' },
              ]}
            />
            <Select
              label="Status"
              containerClassName="[&>label]:sr-only"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatusFilter)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active only' },
                { value: 'deactivated', label: 'Deactivated only' },
              ]}
            />
          </div>
          {filtersActive && (
            <Button variant="ghost" onClick={resetFilters} className="lg:ml-auto">
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      <DataTable
        caption="Roles and account status for every user"
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(key, order) => {
          setSortBy(key as UserSortKey)
          setSortOrder(order)
        }}
        empty={
          filtersActive ? (
            <EmptyState
              title="No users match those filters"
              description="Try a different search term, or clear the filters to see everyone."
              action={
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<KeyIcon size={22} />}
              title="No accounts yet"
              description="Roles and permissions appear here once users exist."
            />
          )
        }
        footer={
          total > PAGE_SIZE ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : null
        }
      />

      <ConfirmDialog
        open={!!roleTarget}
        onClose={() => {
          setRoleTarget(null)
          setActionError(null)
        }}
        onConfirm={() => void applyRoleChange()}
        loading={busy}
        error={actionError}
        title={roleTarget?.next === 'admin' ? 'Make this user an admin?' : 'Change to client?'}
        description={roleTarget ? `${fullName(roleTarget.user)} · ${roleTarget.user.email}` : undefined}
        confirmLabel={roleTarget?.next === 'admin' ? 'Make admin' : 'Change to client'}
        consequence={
          roleTarget?.next === 'admin'
            ? 'They will be able to view, edit, deactivate and change the role of every account, including yours.'
            : 'They will lose access to user management and every admin-only page.'
        }
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        destructive
        onClose={() => {
          setDeactivateTarget(null)
          setActionError(null)
        }}
        onConfirm={() => void applyDeactivate()}
        loading={busy}
        error={actionError}
        title="Deactivate this account?"
        description={
          deactivateTarget ? `${fullName(deactivateTarget)} · ${deactivateTarget.email}` : undefined
        }
        confirmLabel="Deactivate account"
        consequence="They will be signed out and unable to sign in again. Nothing is erased — you can reactivate them from this page at any time."
      />
    </div>
  )
}
