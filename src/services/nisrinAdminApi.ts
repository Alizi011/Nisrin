import { parseAdminOrderDrafts, type NisrinOrderDraftPage } from '@/services/nisrinOrderDrafts'
import { isDraftImageAcceptable, isPrivateMediaPath } from '@/services/nisrinImagePolicy'

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
      // Only the signed-in staff password-change route has a narrowly scoped
      // error distinction. An HTML/nginx 403 must still show "server blocked".
      if (path === '/auth/staff/password/change') {
        const failure: unknown = await response.clone().json().catch(() => null)
        if (failure && typeof failure === 'object' && 'error' in failure &&
            failure.error === 'Current password incorrect') {
          throw new NisrinApiError('Nåværende passord er feil.', 403)
        }
      }
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

export async function login(email: string, password: string, portal: 'staff' | 'customer' = 'staff'): Promise<NisrinUser> {
  // NISRIN server generates a session-bound CSRF token.
  // If /auth/ is blocked, credentials are never sent.
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const path = portal === 'customer' ? '/auth/customer/login' : '/auth/login'
  const result = await request<{ user: NisrinUser }>(path, {
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

/**
 * A staff member changes a manually issued initial password using the existing
 * authenticated CSRF session. The PHP server revokes the session on success.
 */
export async function changeStaffPassword(currentPassword: string, newPassword: string): Promise<void> {
  if (!currentPassword || currentPassword.length > 1024 ||
      newPassword.length < 12 || newPassword.length > 1024 ||
      currentPassword === newPassword) {
    throw new NisrinApiError('Oppgi nåværende passord og et nytt passord på minst 12 tegn.', 422)
  }
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const result = await request<{
    passwordChanged: boolean
    reauthenticationRequired: boolean
  }>('/auth/staff/password/change', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (result.passwordChanged !== true || result.reauthenticationRequired !== true) {
    throw new NisrinApiError('Passordendringen ble ikke bekreftet av serveren.', 502)
  }
}

export type NisrinAdminProduct = {
  id: number
  name: string
  subtitle: string
  description: string
  ingredients: string
  usage: string
  imagePath: string
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

/**
 * Upload one real photo to the PRIVATE backend media store for an unpublished
 * product. A successful upload is never a product approval or publication.
 */
export async function uploadDraftProductImage(id: number, file: File): Promise<string> {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new NisrinApiError('Ugyldig produkt-ID.', 400)
  }
  if (!file || !isDraftImageAcceptable(file)) {
    throw new NisrinApiError('Velg JPEG, PNG eller WebP på maksimalt 4 MB.', 400)
  }

  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const form = new FormData()
  form.append('image', file)
  // Do not set Content-Type: the browser must generate the multipart boundary.
  const result = await request<{
    saved: boolean
    published: boolean
    productId: number
    imagePath: string
  }>(`/admin/products/${id}/image`, {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
    body: form,
  })
  if (result.saved !== true || result.published !== false ||
      result.productId !== id ||
      !isPrivateMediaPath(result.imagePath)) {
    throw new NisrinApiError('Serveren bekreftet ikke trygg lagring av produktbildet.', 502)
  }
  return result.imagePath
}

export type NisrinCreateProductInput = Omit<NisrinProductDraftInput, 'variants'> & {
  variants: Array<{ sku: string; label: string; priceOre: number }>
}

/** Create only an unpublished draft; publication and approvals are never client options. */
export async function createProductDraft(input: NisrinCreateProductInput): Promise<number> {
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const result = await request<{ created: boolean; id: number }>('/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(input),
  })
  if (result.created !== true || !Number.isSafeInteger(result.id) || result.id < 1) {
    throw new NisrinApiError('Serveren bekreftet ikke opprettelsen av produktutkastet.', 502)
  }
  return result.id
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

export type NisrinInventoryVariant = {
  variantId: number
  productId: number
  productName: string
  sku: string
  variantLabel: string
  productStatus: string
  complianceStatus: string
  isActive: boolean
  stockConfigured: boolean
  onHand: number | null
  reserved: number | null
  availableQty: number | null
  stockIssue: 'verified' | 'unknown' | 'expired_only' | 'reconciliation_required'
  lotCount: number
  expiredLotCount: number
}

/**
 * The admin stock view reads only NISRIN's real lot ledger. Reject malformed
 * availability instead of rendering a guessed stock number. New-lot receipts
 * use a separate audited endpoint; arbitrary stocktake remains unavailable.
 */
export async function getAdminInventory(): Promise<NisrinInventoryVariant[]> {
  const response = await request<{ variants: NisrinInventoryVariant[] }>('/admin/inventory')
  if (!Array.isArray(response.variants) ||
      !response.variants.every((entry) => {
        if (!entry || !Number.isSafeInteger(entry.variantId) || entry.variantId < 1 ||
            !Number.isSafeInteger(entry.lotCount) || entry.lotCount < 0 ||
            !Number.isSafeInteger(entry.expiredLotCount) || entry.expiredLotCount < 0 ||
            entry.expiredLotCount > entry.lotCount ||
            !['verified', 'unknown', 'expired_only', 'reconciliation_required'].includes(entry.stockIssue)) {
          return false
        }
        if (entry.stockIssue === 'verified') {
          return entry.stockConfigured === true &&
            Number.isSafeInteger(entry.onHand) &&
            Number.isSafeInteger(entry.reserved) &&
            Number.isSafeInteger(entry.availableQty) &&
            entry.onHand !== null && entry.reserved !== null && entry.availableQty !== null &&
            entry.onHand >= 0 && entry.onHand <= 1000000 &&
            entry.reserved >= 0 && entry.reserved <= entry.onHand &&
            entry.availableQty === entry.onHand - entry.reserved
        }
        return entry.stockConfigured === false &&
          entry.onHand === null && entry.reserved === null && entry.availableQty === null
      })) {
    throw new NisrinApiError('Ugyldig lagerjournal fra NISRIN-serveren.', 502)
  }
  return response.variants
}


export type NisrinWarehouse = { id: number; code: string; name: string }
export type NisrinLotReceipt = {
  variantId: number
  warehouseId: number
  lotNumber: string
  expiryDate: string | null
  quantity: number
}

export async function getInventoryWarehouses(): Promise<NisrinWarehouse[]> {
  const result = await request<{ warehouses: NisrinWarehouse[] }>('/admin/inventory/warehouses')
  if (!Array.isArray(result.warehouses) || !result.warehouses.every((w) =>
    w && Number.isSafeInteger(w.id) && w.id > 0 &&
    typeof w.code === 'string' && typeof w.name === 'string')) {
    throw new NisrinApiError('Ugyldig lagerstedsliste fra serveren.', 502)
  }
  return result.warehouses
}

/** Register a real warehouse; never infer success or auto-retry. */
export async function createInventoryWarehouse(input: { code: string; name: string }): Promise<NisrinWarehouse> {
  if (!/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(input.code) ||
      !input.name || input.name.trim() !== input.name ||
      new TextEncoder().encode(input.name).length > 150 || /\p{C}/u.test(input.name)) {
    throw new NisrinApiError('Kontroller lagerkode og navn.', 422)
  }
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const result = await request<{ warehouse: NisrinWarehouse }>('/admin/inventory/warehouses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  const warehouse = result.warehouse
  if (!warehouse || !Number.isSafeInteger(warehouse.id) || warehouse.id < 1 ||
      warehouse.code !== input.code || warehouse.name !== input.name) {
    throw new NisrinApiError('Lagerstedet ble ikke bekreftet. Kontroller listen før nytt forsøk.', 502)
  }
  return warehouse
}

/** Never auto-retry an ambiguous receipt. Only server-confirmed receipt is success. */
export async function receiveInventoryLot(input: NisrinLotReceipt): Promise<number> {
  if (!Number.isSafeInteger(input.variantId) || input.variantId < 1 ||
      !Number.isSafeInteger(input.warehouseId) || input.warehouseId < 1 ||
      !Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000000 ||
      !/^[A-Za-z0-9][A-Za-z0-9._ -]{0,99}$/.test(input.lotNumber) ||
      input.lotNumber.trim() !== input.lotNumber ||
      (input.expiryDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(input.expiryDate))) {
    throw new NisrinApiError('Kontroller vareparti, lagersted, dato og antall.', 422)
  }
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const result = await request<{ lotId: number; receivedQuantity: number }>('/admin/inventory/receipts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!Number.isSafeInteger(result.lotId) || result.lotId < 1 ||
      result.receivedQuantity !== input.quantity) {
    throw new NisrinApiError('Varemottaket ble ikke bekreftet. Kontroller journalen før nytt forsøk.', 502)
  }
  return result.lotId
}

/**
 * List only persisted UNPAID drafts. This is not a customer-order or payment
 * API; no request to create/reserve/capture anything is made here.
 */
export async function getAdminOrderDrafts(before?: number): Promise<NisrinOrderDraftPage> {
  if (before !== undefined && (!Number.isSafeInteger(before) || before < 1)) {
    throw new NisrinApiError('Ugyldig side i ordreutkastoversikten.', 400)
  }
  const suffix = before === undefined ? '' : `?before=${before}`
  const payload = await request<unknown>(`/admin/order-drafts${suffix}`)
  return parseAdminOrderDrafts(payload)
}
