import * as React from "react"
import {
  getMobileViewportSnapshot,
  getServerMobileViewportSnapshot,
  subscribeMobileViewport,
} from "./mobile-viewport.ts"

// React handles subscribing and comparing snapshots without an effect-time setState.
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  )
}
