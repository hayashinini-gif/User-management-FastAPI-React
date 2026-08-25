import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { meAPI } from '../services/api'
import { apiErrorMessage, formatDate, fullName, initials } from '../lib/format'
import { Alert } from '../components/ui/Alert'
import { Avatar } from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardFooter, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'

type Errors = Partial<Record<'first_name' | 'last_name' | 'age', string>>

export const Profile = () => {
  const { user, updateUserProfile } = useAuth()
  const { addToast } = useToast()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    city: '',
    age: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
      city: user.city ?? '',
      age: user.age?.toString() ?? '',
    })
  }, [user])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = () => {
    const next: Errors = {}
    if (!form.first_name.trim()) next.first_name = 'Required.'
    if (!form.last_name.trim()) next.last_name = 'Required.'
    if (form.age) {
      const age = Number(form.age)
      if (!Number.isInteger(age) || age < 18 || age > 150)
        next.age = 'Enter a whole number from 18 to 150.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return

    setSaving(true)
    try {
      const { data } = await meAPI.update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim() || null,
        city: form.city.trim() || null,
        age: form.age ? Number(form.age) : null,
      })
      updateUserProfile(data)
      addToast('Your profile has been updated.', 'success')
    } catch (err) {
      setFormError(apiErrorMessage(err, 'We could not save your profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader description="Your personal details and account information." />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center py-8 text-center">
            <Avatar initials={initials(user)} name={fullName(user)} size="xl" />
            <h2 className="mt-4 text-base font-semibold text-ink">{fullName(user)}</h2>
            <p className="mt-0.5 text-xs text-muted">{user?.email}</p>
            <RoleBadge role={user?.type ?? 'client'} className="mt-3" />

            <dl className="mt-6 w-full space-y-2.5 border-t border-line pt-5 text-left">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-xs text-muted">Account ID</dt>
                <dd className="nums text-xs font-medium text-ink">#{user?.id}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-xs text-muted">Member since</dt>
                <dd className="text-xs font-medium text-ink">{formatDate(user?.created_at)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-xs text-muted">Last updated</dt>
                <dd className="text-xs font-medium text-ink">{formatDate(user?.updated_at)}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Personal information"
            description="Only you and administrators can see these details."
          />
          <form onSubmit={handleSubmit} noValidate>
            <CardBody className="flex flex-col gap-5">
              {formError && <Alert variant="error">{formError}</Alert>}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="First name"
                  value={form.first_name}
                  onChange={set('first_name')}
                  error={errors.first_name}
                  required
                />
                <Input
                  label="Last name"
                  value={form.last_name}
                  onChange={set('last_name')}
                  error={errors.last_name}
                  required
                />
              </div>

              <Input
                label="Email address"
                value={user?.email ?? ''}
                disabled
                hint="Contact an administrator to change your email address."
                readOnly
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="Optional"
                  value={form.phone_number}
                  onChange={set('phone_number')}
                />
                <Input
                  label="City"
                  placeholder="Optional"
                  value={form.city}
                  onChange={set('city')}
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
                  onChange={set('age')}
                  error={errors.age}
                />
                <Input
                  label="Role"
                  value={user?.type === 'admin' ? 'Admin' : 'Client'}
                  disabled
                  readOnly
                  hint="Roles are assigned by an administrator."
                />
              </div>
            </CardBody>

            <CardFooter>
              <Button type="submit" loading={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
