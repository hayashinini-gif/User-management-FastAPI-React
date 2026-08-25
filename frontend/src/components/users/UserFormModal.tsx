import { useEffect, useState } from 'react'
import { adminAPI, authAPI } from '../../services/api'
import { apiErrorMessage } from '../../lib/format'
import type { User, UserRole } from '../../types/user'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'

type Errors = Partial<Record<string, string>>

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: (message: string) => void
  /** Omit to create a new user. */
  user?: User | null
  /** Only an admin sees the role field. The server checks this too. */
  canEditRole: boolean
}

const EMPTY = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  city: '',
  age: '',
  type: 'client' as UserRole,
  password: '',
}

export function UserFormModal({
  open,
  onClose,
  onSaved,
  user,
  canEditRole,
}: UserFormModalProps) {
  const isEdit = !!user
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setFormError(null)
    setForm(
      user
        ? {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.phone_number ?? '',
            city: user.city ?? '',
            age: user.age?.toString() ?? '',
            type: (user.type === 'admin' ? 'admin' : 'client') as UserRole,
            password: '',
          }
        : EMPTY,
    )
  }, [open, user])

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const validate = () => {
    const next: Errors = {}
    if (!form.first_name.trim()) next.first_name = 'Required.'
    if (!form.last_name.trim()) next.last_name = 'Required.'
    if (!form.email.trim()) next.email = 'Required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!isEdit && form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.age) {
      const age = Number(form.age)
      if (!Number.isInteger(age) || age < 18 || age > 150) next.age = 'Enter a whole number from 18 to 150.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return

    const age = form.age ? Number(form.age) : null
    setSaving(true)

    try {
      if (isEdit && user) {
        await adminAPI.updateUser(user.id, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone_number: form.phone_number.trim() || null,
          city: form.city.trim() || null,
          age,
          ...(canEditRole ? { type: form.type } : {}),
        })
        onSaved('User updated.')
      } else {
        // The API creates accounts through /auth/register, which always makes
        // a client. If an admin was requested, promote straight after.
        const created = await authAPI.register({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone_number: form.phone_number.trim() || null,
          city: form.city.trim() || null,
          age,
        })
        if (canEditRole && form.type === 'admin') {
          await adminAPI.promote(created.data.id)
        }
        onSaved('User created.')
      }
      onClose()
    } catch (err) {
      setFormError(apiErrorMessage(err, 'We could not save this user.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit user' : 'Create user'}
      description={
        isEdit
          ? 'Update this account. Changes take effect immediately.'
          : 'Add a new account. They can sign in with the password you set.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <Alert variant="error">{formError}</Alert>}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.first_name}
            onChange={(e) => set('first_name')(e.target.value)}
            error={errors.first_name}
            required
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={(e) => set('last_name')(e.target.value)}
            error={errors.last_name}
            required
          />
        </div>

        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
          error={errors.email}
          required
        />

        {!isEdit && (
          <Input
            label="Temporary password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
            error={errors.password}
            hint={errors.password ? undefined : 'At least 8 characters. Ask them to change it after signing in.'}
            required
          />
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Phone number"
            type="tel"
            placeholder="Optional"
            value={form.phone_number}
            onChange={(e) => set('phone_number')(e.target.value)}
          />
          <Input
            label="City"
            placeholder="Optional"
            value={form.city}
            onChange={(e) => set('city')(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Age"
            type="number"
            min={18}
            max={150}
            placeholder="Optional"
            value={form.age}
            onChange={(e) => set('age')(e.target.value)}
            error={errors.age}
          />
          {canEditRole && (
            <Select
              label="Role"
              value={form.type}
              onChange={(e) => set('type')(e.target.value)}
              hint="Admins can manage every account."
              options={[
                { value: 'client', label: 'Client' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          )}
        </div>
      </form>
    </Modal>
  )
}
