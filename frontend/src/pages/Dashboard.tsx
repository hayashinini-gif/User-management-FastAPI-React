import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { statsAPI } from '../services/api'
import { apiErrorMessage, formatDate, fullName, initials, orDash } from '../lib/format'
import type { CityStat } from '../types/user'
import { BarList } from '../components/charts/BarList'
import { Alert } from '../components/ui/Alert'
import { Avatar } from '../components/ui/Avatar'
import { RoleBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { StatCard } from '../components/ui/StatCard'
import {
  CalendarIcon,
  ChartIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
  UsersIcon,
} from '../components/icons'

/** One labelled fact. Used for the account detail lists. */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-semibold uppercase tracking-[0.06em] text-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm text-ink">{value}</p>
      </div>
    </div>
  )
}

export const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [community, setCommunity] = useState<{
    totalUsers: number | null
    averageAge: number | null
    topCities: CityStat[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setStatsError(null)

    // Settled, not all: one failing statistic must not remove the others.
    const [count, avg, cities] = await Promise.allSettled([
      statsAPI.userCount(),
      statsAPI.averageAge(),
      statsAPI.topCities(),
    ])

    const firstFailure = [count, avg, cities].find((r) => r.status === 'rejected')
    if (firstFailure && firstFailure.status === 'rejected') {
      setStatsError(
        apiErrorMessage(firstFailure.reason, 'Some community statistics are unavailable.'),
      )
    }

    setCommunity({
      totalUsers: count.status === 'fulfilled' ? count.value.data.total_users : null,
      averageAge: avg.status === 'fulfilled' ? avg.value.data.average_age : null,
      topCities:
        cities.status === 'fulfilled' ? cities.value.data.top_cities.filter((c) => c.city) : [],
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const profileIncomplete = !user?.phone_number || !user?.city || !user?.age

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome back, ${user?.first_name ?? 'there'}`}
        description="Here's your account at a glance."
      />

      {profileIncomplete && (
        <Alert variant="info" title="Your profile is missing a few details">
          Adding your phone number, city and age helps us keep your account up to date.{' '}
          <Link to="/profile" className="font-medium underline underline-offset-2">
            Complete your profile
          </Link>
        </Alert>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar initials={initials(user)} name={fullName(user)} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="truncate text-lg font-semibold text-ink">{fullName(user)}</h2>
                <RoleBadge role={user?.type ?? 'client'} />
              </div>
              <p className="mt-1 truncate text-sm text-muted">{user?.email}</p>
              <p className="mt-3 text-xs text-muted">Member since {formatDate(user?.created_at)}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:w-40">
              <Button
                size="sm"
                icon={<PencilIcon size={14} />}
                onClick={() => navigate('/profile')}
                fullWidth
              >
                Edit profile
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<LockIcon size={14} />}
                onClick={() => navigate('/settings')}
                fullWidth
              >
                Change password
              </Button>
            </div>
          </CardBody>

          <div className="border-t border-line px-5 py-2">
            <div className="grid gap-x-8 sm:grid-cols-2">
              <DetailRow icon={<MailIcon size={15} />} label="Email" value={user?.email ?? '—'} />
              <DetailRow
                icon={<PhoneIcon size={15} />}
                label="Phone"
                value={orDash(user?.phone_number)}
              />
              <DetailRow icon={<MapPinIcon size={15} />} label="City" value={orDash(user?.city)} />
              <DetailRow icon={<UserIcon size={15} />} label="Age" value={orDash(user?.age)} />
              <DetailRow
                icon={<CalendarIcon size={15} />}
                label="Last updated"
                value={formatDate(user?.updated_at)}
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label="Total members"
            value={loading ? '—' : (community?.totalUsers ?? '—')}
            hint="Everyone with an active account"
            icon={<UsersIcon size={16} />}
          />
          <StatCard
            label="Average age"
            value={
              loading || !community || community.averageAge === null
                ? '—'
                : community.averageAge.toFixed(1)
            }
            hint="Across members who gave an age"
            icon={<ChartIcon size={16} />}
          />
        </div>
      </div>

      <Card>
        <CardHeader title="Where members are" description="The cities with the most members." />
        <CardBody>
          {loading ? (
            <Skeleton className="h-44" />
          ) : statsError ? (
            <Alert variant="warning">{statsError}</Alert>
          ) : community && community.topCities.length > 0 ? (
            <BarList
              data={community.topCities.map((c) => ({
                label: c.city ?? 'Unknown',
                value: c.user_count,
              }))}
            />
          ) : (
            <EmptyState
              icon={<MapPinIcon size={22} />}
              title="No cities yet"
              description="Cities appear here once members add one to their profile."
            />
          )}
        </CardBody>
      </Card>

    </div>
  )
}
