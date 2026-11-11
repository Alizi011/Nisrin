const API_BASE = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\/$/, '')

export type NisrinUser = {
  id: number
  name: string
  email: string
  roles: string[]
}

export class NisrinApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'NisrinApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
    })
  } catch {
    throw new NisrinApiError('Kunne ikke kontakte NISRIN-API-et. Kontroller tilkoblingen.', 0)
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new NisrinApiError(
        'Administrator-API-et er foreløpig sperret på serveren. Ingen innlogging er utført.',
        403,
      )
    }
    if (response.status === 401) {
      throw new NisrinApiError('E-postadresse eller passord er feil, eller økten er utløpt.', 401)
    }
    if (response.status === 429) {
      throw new NisrinApiError('For mange forsøk. Prøv igjen senere.', 429)
    }
    throw new NisrinApiError('NISRIN-API-et svarte med en feil. Prøv igjen senere.', response.status)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new NisrinApiError('Ugyldig svar fra NISRIN-API-et.', response.status)
  }
}

export async function getSession(): Promise<NisrinUser | null> {
  try {
    const result = await request<{ user: NisrinUser | null }>('/auth/me')
    return result.user
  } catch (error) {
    if (error instanceof NisrinApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

export async function login(email: string, password: string): Promise<NisrinUser> {
  // NISRIN server generates a session-bound CSRF token.
  // If /auth/ is blocked, credentials are never sent.
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const result = await request<{ user: NisrinUser }>('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ email, password }),
  })
  return result.user
}

export async function logout(): Promise<void> {
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  await request<{ ok: true }>('/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: '{}',
  })
}

export type NisrinAdminProduct = {
  id: number
  name: string
  subtitle: string
  description: string
  ingredients: string
  usage: string
  status: string
  complianceStatus: string
  category: string | null
  variants: Array<{
    sku: string
    label: string
    priceOre: number
    isActive: boolean
  }>
}

export async function getAdminProducts(): Promise<NisrinAdminProduct[]> {
  const result = await request<{ products: NisrinAdminProduct[] }>('/admin/products')
  return result.products
}

export type NisrinProductDraftInput = {
  name: string
  subtitle: string
  description: string
  ingredients: string
  usage: string
  variants: Array<{ sku: string; priceOre: number }>
}

/** Save an unpublished draft only. Server enforces role, CSRF, status and SKU list. */
export async function updateDraftProduct(
  id: number,
  input: NisrinProductDraftInput,
): Promise<void> {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new NisrinApiError('Ugyldig produkt-ID.', 400)
  }
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const result = await request<{ updated: boolean; id: number }>(`/admin/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(input),
  })
  if (result.updated !== true || result.id !== id) {
    throw new NisrinApiError('Produktet ble ikke bekreftet lagret av serveren.', 502)
  }
}

export type NisrinStaffRole = 'admin' | 'manager' | 'seller'

export type NisrinStaffUser = {
  id: number
  name: string
  email: string
  status: 'active' | 'disabled'
  role: NisrinStaffRole
}

export async function getStaff(): Promise<NisrinStaffUser[]> {
  const result = await request<{ users: NisrinStaffUser[] }>('/admin/users')
  return result.users
}

async function staffMutation<T>(path: string, method: 'POST' | 'PATCH', payload: unknown): Promise<T> {
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  return request<T>(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(payload),
  })
}

export async function createStaff(input: {
  name: string
  email: string
  role: NisrinStaffRole
  password: string
}): Promise<NisrinStaffUser> {
  const result = await staffMutation<{ user: NisrinStaffUser }>('/admin/users', 'POST', input)
  return result.user
}

export async function updateStaff(
  id: number,
  input: { role: NisrinStaffRole; status: 'active' | 'disabled' },
): Promise<NisrinStaffUser> {
  const result = await staffMutation<{ user: NisrinStaffUser }>(
    `/admin/users/${id}`, 'PATCH', input,
  )
  return result.user
}

export type NisrinAdminOverview = {
  productsTotal: number
  productsDraft: number
  productsPendingApproval: number
  ordersTotal: number
}

export async function getAdminOverview(): Promise<NisrinAdminOverview> {
  const result = await request<{ overview: NisrinAdminOverview }>('/admin/overview')
  return result.overview
}
