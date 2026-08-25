import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type {
  CityStat,
  PaginatedUsers,
  RoleStat,
  SortOrder,
  User,
  UserStatusFilter,
  UserRole,
  UserSortKey,
} from '../types/user'

const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8001/api'

const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  },
)

/* ── Authentication ──────────────────────────────────────────────────────
   NOTE: `type` (role) is deliberately NOT sent from public registration.
   The role a new account gets is the backend's decision, not the browser's. */
export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  phone_number?: string | null
  city?: string | null
  age?: number | null
}

export const authAPI = {
  register: (data: RegisterPayload) => api.post<User>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      email,
      password,
    }),

  getCurrentUser: () => api.get<User>('/users/me'),
}

/* ── The signed-in user's own account ───────────────────────────────────── */
export interface ProfileUpdate {
  first_name?: string
  last_name?: string
  phone_number?: string | null
  city?: string | null
  age?: number | null
}

export const meAPI = {
  get: () => api.get<User>('/users/me'),
  update: (data: ProfileUpdate) => api.put<User>('/users/me', data),
  changePassword: (current_password: string, new_password: string) =>
    api.post<{ message: string }>('/users/me/change-password', {
      current_password,
      new_password,
    }),
}

/* ── User directory (admin only, enforced by the backend) ───────────────── */
export interface ListUsersParams {
  skip?: number
  limit?: number
  /** Partial, case-insensitive match on first name, last name or email. */
  search?: string
  /** Role filter, e.g. 'admin' or 'client'. */
  type?: string
  sortBy?: UserSortKey
  sortOrder?: SortOrder
  /** 'active' (default), 'deactivated', or 'all'. */
  status?: UserStatusFilter
}

export const usersAPI = {
  /**
   * The server does the searching, filtering, sorting and paging — the browser
   * only ever holds one page. `total` in the response is the full match count.
   */
  list: (params: ListUsersParams = {}) =>
    api.get<PaginatedUsers>('/users', {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 10,
        // Omit empty values so the URL stays clean and the server applies its defaults.
        search: params.search?.trim() || undefined,
        type: params.type || undefined,
        sort_by: params.sortBy ?? 'created_at',
        sort_order: params.sortOrder ?? 'desc',
        status: params.status ?? 'active',
      },
    }),
  get: (id: number) => api.get<User>(`/users/${id}`),
  changeRole: (id: number, type: UserRole) => api.put<User>(`/users/${id}/role`, { type }),
  softDelete: (id: number) => api.delete<void>(`/users/${id}`),
  restore: (id: number) => api.post<User>(`/users/${id}/restore`),
}

/* ── Admin-only mutations ───────────────────────────────────────────────── */
export interface AdminUserUpdate {
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string | null
  city?: string | null
  age?: number | null
  type?: UserRole
}

export const adminAPI = {
  updateUser: (id: number, data: AdminUserUpdate) =>
    api.put<User>(`/admin/users/${id}`, data),
  promote: (id: number) => api.post<User>(`/admin/users/${id}/promote`),
  softDelete: (id: number) => api.delete<void>(`/admin/users/${id}`),
}

/* ── Statistics ─────────────────────────────────────────────────────────── */
export const statsAPI = {
  userCount: () => api.get<{ total_users: number }>('/stats/user-count'),
  averageAge: () => api.get<{ average_age: number | null }>('/stats/average-age'),
  topCities: () => api.get<{ top_cities: CityStat[] }>('/stats/top-cities'),
  userDistribution: () => api.get<{ distribution: RoleStat[] }>('/stats/user-distribution'),
}

export default api
