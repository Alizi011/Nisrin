import type { NisrinUser } from '@/services/nisrinAdminApi'

export function isCustomer(user: NisrinUser | null): user is NisrinUser {
  return user !== null && user.roles.includes('customer') &&
    !user.roles.some((role) => ['admin', 'manager', 'seller'].includes(role))
}

export function parseCustomerRegistration(value: unknown): {
  created: true
  checkoutAvailable: false
  emailVerified: false
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Serveren bekreftet ikke kunderegistrering.')
  }
  const r = value as Record<string, unknown>
  const user = r.user as Record<string, unknown> | undefined
  if (r.created !== true || r.checkoutAvailable !== false ||
      r.emailVerified !== false || !user ||
      !Array.isArray(user.roles) || user.roles.length !== 1 ||
      user.roles[0] !== 'customer') {
    throw new Error('Serveren returnerte ikke en gyldig kundekonto.')
  }
  return { created: true, checkoutAvailable: false, emailVerified: false }
}

