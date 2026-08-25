import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { meAPI } from '../services/api'
import { apiErrorMessage } from '../lib/format'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardFooter, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { EyeIcon, EyeOffIcon, LockIcon, LogOutIcon } from '../components/icons'

type Errors = Partial<Record<'current' | 'next' | 'confirm', string>>

export const Settings = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { addToast } = useToast()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const e: Errors = {}
    if (!current) e.current = 'Enter your current password.'
    if (next.length < 8) e.next = 'Use at least 8 characters.'
    else if (next === current) e.next = 'Choose a password different from your current one.'
    if (confirm !== next) e.confirm = 'The two passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccess(false)
    if (!validate()) return

    setSaving(true)
    try {
      await meAPI.changePassword(current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      setSuccess(true)
      addToast('Your password has been changed.', 'success')
    } catch (err) {
      setFormError(apiErrorMessage(err, 'We could not change your password.'))
    } finally {
      setSaving(false)
    }
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      aria-label={show ? 'Hide passwords' : 'Show passwords'}
      className="flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted transition-colors hover:bg-canvas hover:text-ink"
    >
      {show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
    </button>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader description="Manage your password and session." />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Change password"
            description="Choose a password you don't use anywhere else."
          />
          <form onSubmit={handleSubmit} noValidate>
            <CardBody className="flex max-w-md flex-col gap-5">
              {formError && <Alert variant="error">{formError}</Alert>}
              {success && (
                <Alert variant="success">
                  Your password has been changed. Use it the next time you sign in.
                </Alert>
              )}

              <Input
                label="Current password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                error={errors.current}
                leadingIcon={<LockIcon size={16} />}
                trailing={toggle}
                required
              />
              <Input
                label="New password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                error={errors.next}
                hint={errors.next ? undefined : 'At least 8 characters.'}
                required
              />
              <Input
                label="Confirm new password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={errors.confirm}
                required
              />
            </CardBody>

            <CardFooter>
              <Button type="submit" loading={saving}>
                {saving ? 'Updating…' : 'Update password'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Session" description="You are signed in on this device." />
          <CardBody>
            <p className="text-xs leading-relaxed text-muted">
              Signing out clears your session from this browser. You'll need your email and
              password to get back in.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              fullWidth
              icon={<LogOutIcon size={15} />}
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              Sign out
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
