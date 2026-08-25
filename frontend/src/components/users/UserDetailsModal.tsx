import type { User } from '../../types/user'
import { formatDateTime, fullName, initials, orDash } from '../../lib/format'
import { Avatar } from '../ui/Avatar'
import { RoleBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface UserDetailsModalProps {
  user: User | null
  onClose: () => void
  onEdit: (user: User) => void
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-xs font-medium text-ink">{value}</dd>
    </div>
  )
}

export function UserDetailsModal({ user, onClose, onEdit }: UserDetailsModalProps) {
  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="User details"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {user && <Button onClick={() => onEdit(user)}>Edit user</Button>}
        </>
      }
    >
      {user && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3.5 rounded-lg border border-line bg-surface-muted p-4">
            <Avatar initials={initials(user)} name={fullName(user)} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{fullName(user)}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              <RoleBadge role={user.type} className="mt-2" />
            </div>
          </div>

          <dl className="divide-y divide-line">
            <Row label="User ID" value={`#${user.id}`} />
            <Row label="Phone" value={orDash(user.phone_number)} />
            <Row label="City" value={orDash(user.city)} />
            <Row label="Age" value={orDash(user.age)} />
            <Row label="Created" value={formatDateTime(user.created_at)} />
            <Row label="Last updated" value={formatDateTime(user.updated_at)} />
          </dl>
        </div>
      )}
    </Modal>
  )
}
