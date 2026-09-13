import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usersAPI } from '../services/api'
import { apiErrorMessage, formatDate, fullName, initials, orDash } from '../lib/format'
import { useDebounced } from '../lib/useDebounced'
import { UserDetailsModal } from '../components/users/UserDetailsModal'
import { UserFormModal } from '../components/users/UserFormModal'
import { Avatar } from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { Column } from '../components/ui/DataTable'
import { DataTable } from '../components/ui/DataTable'
import { DropdownMenu } from '../components/ui/DropdownMenu'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import type { FilterSuggestion, SortOrder, User, UserRole, UserSortKey, UserStatusFilter } from '../types/user'
import { NaturalLanguageFilter } from '../components/users/NaturalLanguageFilter'
import {
  EyeIcon,
  MoreIcon,
  PencilIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
} from '../components/icons'

const PAGE_SIZE = 10
const ALL = 'all'

export const Users = () => {
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()

  const [rows, setRows] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search)
  const [role, setRole] = useState(ALL)
  const [sortBy, setSortBy] = useState<UserSortKey>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)

  const [viewing, setViewing] = useState<User | null>(null)
  const [editing, setEditing] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [roleTarget, setRoleTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [status, setStatus] = useState<UserStatusFilter>('active')

  /* Searching and paging happen on the server now, so the browser only ever
     holds one page. Responses can arrive out of order when someone types
     quickly, so each request carries a number and only the newest one is
     allowed to write to state. */
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
        sortBy,
        sortOrder,
        status,
      })
      if (id !== requestId.current) return
      setRows(data.items)
      setTotal(data.total)
    } catch (err) {
      if (id !== requestId.current) return
      setError(apiErrorMessage(err, 'We could not load the user list.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [page, debouncedSearch, role, sortBy, sortOrder, status])

  useEffect(() => {
    void load()
  }, [load])

  // Any change to what is being asked for sends you back to the first page —
  // page 4 of the old result set is meaningless against a new one.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, role, sortBy, sortOrder, status])

  const filtersActive = search.trim() !== '' || role !== ALL || status !== 'active'

  const resetFilters = () => {
    setSearch('')
    setRole(ALL)
    setStatus('active')
  }

    /**
   * The AI's output arrives here already validated by the server. All this
   * does is write it into the same state a mouse click writes to — which is
   * why no part of the page below this needs to know the AI exists.
   */
  const applySuggestion = (s: FilterSuggestion) => {
    const touchesFilters =
      s.search !== null || s.type !== null || s.status !== null ||
      s.sort_by !== null || s.sort_order !== null

    // Nothing supported in the request (e.g. "users from Beirut"). Changing
    // nothing is better than silently wiping the admin's current view.
    if (!touchesFilters) return

    // Whole-state replacement: null resets to the page default.
    setSearch(s.search ?? '')
    setRole(s.type ?? ALL)
    setStatus(s.status ?? 'active')
    setSortBy(s.sort_by ?? 'created_at')
    setSortOrder(s.sort_order ?? 'desc')
    setPage(1)
  }

  const handleSort = (key: string, order: SortOrder) => {
    setSortBy(key as UserSortKey)
    setSortOrder(order)
  }

  const handleRoleChange = async () => {
    if (!roleTarget) return
    const nextRole: UserRole = roleTarget.type === 'admin' ? 'client' : 'admin'
    setActionLoading(true)
    setActionError(null)
    try {
      await usersAPI.changeRole(roleTarget.id, nextRole)
      addToast(
        `${fullName(roleTarget)} is now ${nextRole === 'admin' ? 'an admin' : 'a client'}.`,
        'success',
      )
      setRoleTarget(null)
      await load()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'We could not change this role.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    setActionError(null)
    try {
      await usersAPI.softDelete(deleteTarget.id)
      addToast(`${fullName(deleteTarget)} has been deactivated.`, 'success')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'We could not deactivate this account.'))
    } finally {
      setActionLoading(false)
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      sortKey: 'first_name',
      render: (u) => (
        <div className="flex items-center gap-3">
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
    { key: 'role', header: 'Role', sortKey: 'type', render: (u) => <RoleBadge role={u.type} /> },
    {
      key: 'city',
      header: 'City',
      sortKey: 'city',
      render: (u) => <span className="text-xs text-body">{orDash(u.city)}</span>,
    },
    {
      key: 'age',
      header: 'Age',
      sortKey: 'age',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (u) => <span className="nums text-xs text-body">{orDash(u.age)}</span>,
    },
    {
      key: 'created',
      header: 'Created',
      sortKey: 'created_at',
      render: (u) => <span className="nums text-xs text-muted">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-14',
      render: (u) => (
        <div className="flex justify-end">
          <DropdownMenu
            label={`Actions for ${fullName(u)}`}
            trigger={
              <span className="flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink">
                <MoreIcon size={16} />
              </span>
            }
            items={[
              { label: 'View details', icon: <EyeIcon size={14} />, onSelect: () => setViewing(u) },
              { label: 'Edit user', icon: <PencilIcon size={14} />, onSelect: () => setEditing(u) },
              {
                label: u.type === 'admin' ? 'Change to client' : 'Make admin',
                icon: u.type === 'admin' ? <UserIcon size={14} /> : <ShieldIcon size={14} />,
                onSelect: () => setRoleTarget(u),
                disabled: u.id === currentUser?.id,
              },
              {
                label: 'Deactivate user',
                icon: <TrashIcon size={14} />,
                onSelect: () => setDeleteTarget(u),
                destructive: true,
                disabled: u.id === currentUser?.id,
              },
            ]}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Everyone with an account, and what they can do."
        actions={
          <Button icon={<UserPlusIcon size={15} />} onClick={() => setCreating(true)}>
            Create user
          </Button>
        }
      />

      <Card className="p-4">
        <NaturalLanguageFilter onApply={applySuggestion} />
        <div className="my-4 border-t border-line" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-sm lg:flex-1"
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email…"
          />
          <div className="lg:w-48">
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
          </div>

           <div className="lg:w-48">
            <Select
              label="Status"
              containerClassName="[&>label]:sr-only"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatusFilter)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'deactivated', label: 'Deactivated' },
                { value: 'all', label: 'All statuses' },
              ]}
            />
          </div>


          {filtersActive && (
            <Button variant="ghost" onClick={resetFilters} className="lg:ml-auto">
              Clear filters
            </Button>
          )}
        </div>

        {filtersActive && !loading && !error && (
          <p className="mt-3 text-xs text-muted">
            <span className="nums font-medium text-ink">{total}</span>{' '}
            {total === 1 ? 'user matches' : 'users match'} your filters
          </p>
        )}
      </Card>

      <DataTable
        caption="All user accounts"
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSort}
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
              icon={<UsersIcon size={22} />}
              title="No users yet"
              description="Create the first account to get started."
              action={
                <Button size="sm" icon={<UserPlusIcon size={14} />} onClick={() => setCreating(true)}>
                  Create user
                </Button>
              }
            />
          )
        }
        footer={
          total > PAGE_SIZE ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : null
        }
      />

      <UserDetailsModal
        user={viewing}
        onClose={() => setViewing(null)}
        onEdit={(u) => {
          setViewing(null)
          setEditing(u)
        }}
      />

      <UserFormModal
        open={creating || !!editing}
        user={editing}
        canEditRole
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSaved={(message) => {
          addToast(message, 'success')
          void load()
        }}
      />

      <ConfirmDialog
        open={!!roleTarget}
        onClose={() => {
          setRoleTarget(null)
          setActionError(null)
        }}
        onConfirm={() => void handleRoleChange()}
        loading={actionLoading}
        error={actionError}
        title={roleTarget?.type === 'admin' ? 'Change to client?' : 'Make this user an admin?'}
        description={roleTarget ? fullName(roleTarget) : undefined}
        confirmLabel={roleTarget?.type === 'admin' ? 'Change to client' : 'Make admin'}
        consequence={
          roleTarget?.type === 'admin'
            ? 'They will lose access to user management and admin-only pages.'
            : 'They will be able to view, edit and deactivate every account, including yours.'
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        destructive
        onClose={() => {
          setDeleteTarget(null)
          setActionError(null)
        }}
        onConfirm={() => void handleDelete()}
        loading={actionLoading}
        error={actionError}
        title="Deactivate this user?"
        description={deleteTarget ? `${fullName(deleteTarget)} · ${deleteTarget.email}` : undefined}
        confirmLabel="Deactivate user"
        consequence="They will immediately lose access and disappear from this list. The record is kept, so this can be reversed from Roles & Permissions."
      />
    </div>
  )
}
