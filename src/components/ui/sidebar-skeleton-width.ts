// Derive a varied, hydration-safe skeleton width from React.useId().
// The 50–89% range matches the previous visual treatment without render-time randomness.
export function getSidebarSkeletonWidth(id: string): string {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (Math.imul(hash, 31) + id.charCodeAt(index)) >>> 0
  }
  return `${50 + (hash % 40)}%`
}
