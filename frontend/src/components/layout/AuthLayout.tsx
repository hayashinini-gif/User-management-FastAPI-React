import type { ReactNode } from 'react'
import { ShieldIcon } from '../icons'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Split screen: the brand panel carries the deep purple, the form side stays
 * white and calm so the fields are the only thing competing for attention.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-nav-900 p-12 lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-600/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-brand-500/15 blur-3xl"
          aria-hidden="true"
        />

        <span className="relative flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-brand-500 text-white">
            <ShieldIcon size={17} />
          </span>
          <span className="text-base font-semibold text-white">Console</span>
        </span>

        <div className="relative max-w-sm">
          <p className="text-2xl font-semibold leading-snug tracking-[-0.02em] text-white">
            User management, without the clutter.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-nav-fg">
            Accounts, roles and permissions in one calm place — with every
            action checked on the server, not just in the browser.
          </p>
        </div>

        <p className="relative text-2xs text-nav-fg/70">
          Protected by token-based authentication.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-surface px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <span className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-md bg-brand-600 text-white">
              <ShieldIcon size={17} />
            </span>
            <span className="text-base font-semibold text-ink">Console</span>
          </span>

          <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-xs text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
