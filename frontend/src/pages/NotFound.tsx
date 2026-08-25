import { Link } from 'react-router-dom'
import { AlertCircleIcon } from '../components/icons'

export const NotFound = () => (
  <div className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-12">
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <AlertCircleIcon size={22} />
      </span>
      <h1 className="mt-5 text-lg font-semibold text-ink">We couldn't find that page</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        The link may be out of date, or the page may have moved.
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
