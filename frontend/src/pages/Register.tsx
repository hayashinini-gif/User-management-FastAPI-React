import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../components/icons'

type Errors = Partial<Record<'first_name' | 'last_name' | 'email' | 'password' | 'confirm', string>>

/* Public registration never offers a role picker. New accounts get their role
   from the backend — the browser does not get a say. */
export const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { addToast } = useToast()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = () => {
    const next: Errors = {}
    if (!form.first_name.trim()) next.first_name = 'Enter your first name.'
    if (!form.last_name.trim()) next.last_name = 'Enter your last name.'
    if (!form.email.trim()) next.email = 'Enter your email address.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      next.email = 'That does not look like an email address.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) next.confirm = 'The two passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      addToast('Your account is ready.', 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'We could not create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <Alert variant="error">{formError}</Alert>}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            autoComplete="given-name"
            placeholder="Ada"
            value={form.first_name}
            onChange={set('first_name')}
            error={errors.first_name}
            required
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            placeholder="Lovelace"
            value={form.last_name}
            onChange={set('last_name')}
            error={errors.last_name}
            required
          />
        </div>

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          leadingIcon={<MailIcon size={16} />}
          required
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint={errors.password ? undefined : 'Use at least 8 characters.'}
          leadingIcon={<LockIcon size={16} />}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          }
        />

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          required
        />

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-2xs leading-relaxed text-muted">
          You can add your phone, city and age from your profile once you are in.
        </p>
      </form>
    </AuthLayout>
  )
}
