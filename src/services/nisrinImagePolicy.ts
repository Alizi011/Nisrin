/**
 * Browser-side UX checks only. The PHP backend independently verifies file
 * bytes, MIME, size, role, CSRF, status and compliance before persisting.
 */
export function isDraftImageAcceptable(file: { size: number; type: string }): boolean {
  return Number.isSafeInteger(file.size) &&
    file.size > 0 &&
    file.size <= 4 * 1024 * 1024 &&
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}

/** Do not treat an arbitrary URL or an unverified server response as a stored image. */
export function isPrivateMediaPath(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\/media\/[a-f0-9]{48}\.(jpg|png|webp)$/.test(value)
}
