import { Link } from 'react-router-dom'
import { LockIcon } from '../components/icons'

export const Unauthorized = () => (
  <div className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-12">
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning-50 text-warning-700">
        <LockIcon size={22} />
      </span>
      <h1 className="mt-5 text-lg font-semibold text-ink">You don't have access to that page</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This area is limited to administrators. If you think you should have access, ask an
        administrator to update your role.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  </div>
)
