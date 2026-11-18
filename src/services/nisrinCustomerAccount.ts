import { getSession, login, logout, type NisrinUser } from '@/services/nisrinAdminApi'
import { isCustomer, parseCustomerRegistration } from '@/services/customerAccountValidation'

const API = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\/+$/, '')

export async function registerCustomer(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  if (!name.trim() || name.trim().length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 12 || password.length > 1024) {
    throw new Error('Kontroller navn, e-post og passord (minst 12 tegn).')
  }
  // The same server session, CSRF and Origin rules as existing staff login.
  const tokenResponse = await fetch(API + '/auth/csrf', {
    credentials: 'include', cache: 'no-store',
  })
  if (!tokenResponse.ok) {
    throw new Error('Kunderegistrering er ennå ikke åpnet på NISRIN-serveren.')
  }
  const token = await tokenResponse.json() as { csrfToken?: unknown }
  if (typeof token.csrfToken !== 'string' || token.csrfToken.length < 32) {
    throw new Error('Ugyldig sikkerhetstoken fra serveren.')
  }
  const response = await fetch(API + '/auth/register', {
    method: 'POST', credentials: 'include', cache: 'no-store',
    headers: {
      'Content-Type': 'application/json', Accept: 'application/json',
      'X-CSRF-Token': token.csrfToken,
    },
    body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
  })
  if (response.status === 409) {
    throw new Error('E-postadressen er allerede registrert.')
  }
  if (!response.ok) {
    throw new Error('Kunderegistrering kunne ikke gjennomføres.')
  }
  parseCustomerRegistration(await response.json())
}

export async function getCustomerSession(): Promise<NisrinUser | null> {
  const current = await getSession()
  return isCustomer(current) ? current : null
}

export async function loginCustomer(email: string, password: string): Promise<NisrinUser> {
  const user = await login(email, password, 'customer')
  if (!isCustomer(user)) {
    await logout()
    throw new Error('Denne kontoen er ikke en kundekonto. Bruk ansattinnloggingen.')
  }
  return user
}

export { logout as logoutCustomer }
