import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { statsAPI, usersAPI } from '../services/api'
import { apiErrorMessage, formatDate, fullName, initials, orDash } from '../lib/format'
import { categoricalColor } from '../lib/chartColors'
import type { CityStat, RoleStat, User } from '../types/user'
import { BarList } from '../components/charts/BarList'
import { DonutChart } from '../components/charts/DonutChart'
import { Alert } from '../components/ui/Alert'
import { Avatar } from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { SkeletonCard, SkeletonStatCards } from '../components/ui/Skeleton'
import { StatCard } from '../components/ui/StatCard'
import { ChartIcon, MapPinIcon, ShieldIcon, UsersIcon } from '../components/icons'

/**
 * Each panel loads independently. A single failing endpoint degrades that one
 * panel and says so — it must never blank the whole dashboard, which is what
 * a plain Promise.all would do.
 */
interface Overview {
  totalUsers: number | null
  averageAge: number | null
  distribution: RoleStat[] | null
  topCities: CityStat[] | null
  recent: User[] | null
}

const EMPTY: Overview = {
  totalUsers: null,
  averageAge: null,
  distribution: null,
  topCities: null,
  recent: null,
}

const ROLE_LABEL: Record<string, string> = { admin: 'Admins', client: 'Clients' }

export const AdminDashboard = () => {
  const [data, setData] = useState<Overview>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const [count, avg, dist, cities, users] = await Promise.allSettled([
      statsAPI.userCount(),
      statsAPI.averageAge(),
      statsAPI.userDistribution(),
      statsAPI.topCities(),
      usersAPI.list({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
    ])

    const next: Overview = { ...EMPTY }
    const failed: Record<string, string> = {}

    if (count.status === 'fulfilled') next.totalUsers = count.value.data.total_users
    else failed.count = apiErrorMessage(count.reason, 'Total users could not be loaded.')

    if (avg.status === 'fulfilled') next.averageAge = avg.value.data.average_age
    else failed.avg = apiErrorMessage(avg.reason, 'Average age could not be loaded.')

    if (dist.status === 'fulfilled') next.distribution = dist.value.data.distribution
    else failed.roles = apiErrorMessage(dist.reason, 'The role split could not be loaded.')

    if (cities.status === 'fulfilled')
      next.topCities = cities.value.data.top_cities.filter((c) => c.city)
    else failed.cities = apiErrorMessage(cities.reason, 'Top cities could not be loaded.')

    if (users.status === 'fulfilled') {
      // The server already sorted and limited this — no client-side slicing.
      next.recent = users.value.data.items
    } else {
      failed.recent = apiErrorMessage(users.reason, 'The user list could not be loaded.')
    }

    setData(next)
    setErrors(failed)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const countFor = (role: string) => data.distribution?.find((d) => d.type === role)?.count ?? null
  const everythingFailed = Object.keys(errors).length === 5

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="How the user base looks right now."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} loading={loading}>
            Refresh
          </Button>
        }
      />

      {everythingFailed ? (
        <Card>
          <ErrorState
            title="We couldn't reach the server"
            message={Object.values(errors)[0]}
            onRetry={() => void load()}
          />
        </Card>
      ) : (
        <>
          {Object.keys(errors).length > 0 && (
            <Alert variant="warning" title="Some of this page could not be loaded">
              {Object.values(errors)[0]}{' '}
              <span className="opacity-80">Everything else on this page is up to date.</span>
            </Alert>
          )}

          {loading ? (
            <SkeletonStatCards />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                emphasis
                label="Total users"
                value={data.totalUsers ?? '—'}
                hint="Active accounts, excluding deleted"
                icon={<UsersIcon size={16} />}
              />
              <StatCard
                label="Admins"
                value={countFor('admin') ?? '—'}
                hint="Full management access"
                icon={<ShieldIcon size={16} />}
              />
              <StatCard
                label="Clients"
                value={countFor('client') ?? '—'}
                hint="Standard accounts"
                icon={<UsersIcon size={16} />}
              />
              <StatCard
                label="Average age"
                value={data.averageAge === null ? '—' : data.averageAge.toFixed(1)}
                hint={
                  data.averageAge === null
                    ? 'No ages recorded yet'
                    : 'Across users who gave an age'
                }
                icon={<ChartIcon size={16} />}
              />
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3">
            {loading ? (
              <>
                <SkeletonCard className="lg:col-span-2" />
                <SkeletonCard />
              </>
            ) : (
              <>
                <Card className="lg:col-span-2">
                  <CardHeader title="Top cities" description="The five cities with the most users." />
                  <CardBody>
                    {errors.cities ? (
                      <Alert variant="warning">{errors.cities}</Alert>
                    ) : data.topCities && data.topCities.length > 0 ? (
                      <BarList
                        data={data.topCities.map((c) => ({
                          label: c.city ?? 'Unknown',
                          value: c.user_count,
                        }))}
                      />
                    ) : (
                      <EmptyState
                        icon={<MapPinIcon size={22} />}
                        title="No cities recorded"
                        description="City appears here once users add one to their profile."
                      />
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Roles" description="How accounts are split." />
                  <CardBody>
                    {errors.roles ? (
                      <Alert variant="warning">{errors.roles}</Alert>
                    ) : data.distribution && data.distribution.length > 0 ? (
                      <DonutChart
                        centerLabel="Users"
                        data={data.distribution.map((d, i) => ({
                          label: ROLE_LABEL[d.type] ?? d.type,
                          value: d.count,
                          color: categoricalColor(i),
                        }))}
                      />
                    ) : (
                      <EmptyState
                        title="No users yet"
                        description="Roles appear once accounts exist."
                      />
                    )}
                  </CardBody>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader
              title="Recent sign-ups"
              description="The five most recently created accounts."
              action={
                <Link
                  to="/users"
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
                >
                  View all users
                </Link>
              }
            />
            {loading ? (
              <CardBody>
                <SkeletonCard className="border-0 p-0 shadow-none" />
              </CardBody>
            ) : errors.recent ? (
              <ErrorState message={errors.recent} onRetry={() => void load()} />
            ) : data.recent && data.recent.length > 0 ? (
              <ul className="divide-y divide-line">
                {data.recent.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar initials={initials(user)} name={fullName(user)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{fullName(user)}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <span className="hidden text-xs text-muted sm:block">{orDash(user.city)}</span>
                    <RoleBadge role={user.type} />
                    <span className="nums hidden w-24 text-right text-xs text-muted md:block">
                      {formatDate(user.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No users yet" description="New accounts will show up here." />
            )}
          </Card>
        </>
      )}
    </div>
  )
}
