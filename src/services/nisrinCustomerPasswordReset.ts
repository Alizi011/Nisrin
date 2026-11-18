import { customerRequest, tokenFromFragment } from '@/services/nisrinEmailVerification'

/** No enumeration: server responds identically for existing/missing accounts. */
export function parseForgotPassword(value: unknown): true {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      (value as { requested?: unknown }).requested !== true) {
    throw new Error('Serveren bekreftet ikke forespørselen.')
  }
  return true
}

export function parsePasswordReset(value: unknown): true {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      (value as { passwordReset?: unknown }).passwordReset !== true) {
    throw new Error('Serveren bekreftet ikke nytt passord.')
  }
  return true
}

export async function forgotCustomerPassword(email: string): Promise<void> {
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error('Oppgi en gyldig e-postadresse.')
  }
  parseForgotPassword(await customerRequest('/auth/customer/password/forgot',
    'POST', { email: email.trim().toLowerCase() }))
}

export async function resetCustomerPassword(fragment: string, password: string): Promise<void> {
  const token = tokenFromFragment(fragment)
  if (!token || password.length < 12 || password.length > 1024) {
    throw new Error('Ugyldig lenke eller passord (minst 12 tegn).')
  }
  parsePasswordReset(await customerRequest('/auth/customer/password/reset',
    'POST', { token, password }))
}
