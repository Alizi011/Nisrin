// Keep the query consistent for subscribing and reading its current state.
const MOBILE_QUERY = "(max-width: 767px)"

export function subscribeMobileViewport(onChange: () => void): () => void {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener("change", onChange)

  return () => query.removeEventListener("change", onChange)
}

export function getMobileViewportSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches
}

// Hydration must match the markup rendered without access to window.
export function getServerMobileViewportSnapshot(): boolean {
  return false
}
