const API = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\/+$/, '')

export function parseCustomerEmailStatus(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      typeof (value as { emailVerified?: unknown }).emailVerified !== 'boolean') {
    throw new Error('Serveren returnerte ikke en gyldig bekreftelsesstatus.')
  }
  return (value as { emailVerified: boolean }).emailVerified
}

export async function customerRequest(path: string, method: 'GET' | 'POST', body?: unknown): Promise<unknown> {
  let token: string | undefined
  if (method === 'POST') {
    const csrf = await fetch(API + '/auth/csrf', {
      credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
    })
    if (!csrf.ok) throw new Error('Innlogging eller e-postbekreftelse er ikke tilgjengelig.')
    const csrfData = await csrf.json() as { csrfToken?: unknown }
    if (typeof csrfData.csrfToken !== 'string' || csrfData.csrfToken.length < 32) {
      throw new Error('Serverens sikkerhetstoken er ugyldig.')
    }
    token = csrfData.csrfToken
  }

  const response = await fetch(API + path, {
    method, cache: 'no-store', credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(method === 'POST' ? {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token!,
      } : {}),
    },
    ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
  })
  if (!response.ok) {
    if (response.status === 409) throw new Error('Bekreftelseslenken er brukt eller utløpt. Be om en ny lenke.')
    if (response.status === 429) throw new Error('For mange forsøk. Prøv igjen senere.')
    throw new Error('E-postbekreftelse er foreløpig ikke tilgjengelig.')
  }
  return response.json()
}

export async function getEmailVerified(): Promise<boolean> {
  return parseCustomerEmailStatus(
    await customerRequest('/auth/customer/verification/status', 'GET'),
  )
}

export async function requestEmailVerification(): Promise<boolean> {
  const data = await customerRequest('/auth/customer/verification/request', 'POST') as Record<string, unknown>
  if (data.emailVerified === true) return true
  if (data.emailVerificationSent !== true || data.emailVerified !== false) {
    throw new Error('Serveren bekreftet ikke at e-posten ble sendt.')
  }
  return false
}

export function tokenFromFragment(fragment: string): string | null {
  const value = fragment.startsWith('#') ? fragment.slice(1) : fragment
  const params = new URLSearchParams(value)
  const token = params.get('token')
  return token && /^[0-9a-f]{64}$/.test(token) ? token : null
}

export async function confirmEmailVerification(token: string): Promise<void> {
  if (!/^[0-9a-f]{64}$/.test(token)) {
    throw new Error('Ugyldig bekreftelseslenke.')
  }
  const data = await customerRequest('/auth/customer/verification/confirm',
    'POST', { token })
  if (parseCustomerEmailStatus(data) !== true) {
    throw new Error('Serveren bekreftet ikke e-postadressen.')
  }
}
