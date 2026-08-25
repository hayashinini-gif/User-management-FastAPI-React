export type UserRole = 'admin' | 'client'

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  phone_number?: string | null
  city?: string | null
  age?: number | null
  type: UserRole | string
  /** Soft-delete flag. A deactivated account cannot sign in. */
  is_deleted: boolean
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

/** Statistics shapes returned by /api/stats/* */
export interface CityStat {
  city: string | null
  user_count: number
}

export interface RoleStat {
  type: string
  count: number
}

/** Sort columns the API accepts. Keep in step with SORTABLE_COLUMNS on the server. */
export type UserSortKey =
  | 'id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'city'
  | 'age'
  | 'type'
  | 'created_at'
  | 'updated_at'

export type SortOrder = 'asc' | 'desc'

/** Which accounts a list request should include. */
export type UserStatusFilter = 'active' | 'deactivated' | 'all'

/** One page of users plus the total number of matches, ignoring skip/limit. */
export interface PaginatedUsers {
  items: User[]
  total: number
  skip: number
  limit: number
}
