import assert from "node:assert/strict"
import { test } from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import {
  getMobileViewportSnapshot,
  getServerMobileViewportSnapshot,
  subscribeMobileViewport,
} from "../src/hooks/mobile-viewport.ts"
import { useIsMobile } from "../src/hooks/use-mobile.ts"

test("server snapshot is stable without a browser", () => {
  assert.equal(getServerMobileViewportSnapshot(), false)

  function Indicator() {
    return React.createElement("span", null, useIsMobile() ? "mobile" : "desktop")
  }

  assert.equal(
    renderToStaticMarkup(React.createElement(Indicator)),
    "<span>desktop</span>",
  )
})

test("viewport uses a 767px media query, notifies and unsubscribes", () => {
  const previousWindow = globalThis.window
  const listeners = new Set()
  const mediaQuery = {
    matches: false,
    addEventListener(event, listener) {
      assert.equal(event, "change")
      listeners.add(listener)
    },
    removeEventListener(event, listener) {
      assert.equal(event, "change")
      listeners.delete(listener)
    },
  }
  let queryCalls = 0

  globalThis.window = {
    matchMedia(query) {
      assert.equal(query, "(max-width: 767px)")
      queryCalls += 1
      return mediaQuery
    },
  }

  try {
    assert.equal(getMobileViewportSnapshot(), false)
    let notifications = 0
    const unsubscribe = subscribeMobileViewport(() => { notifications += 1 })
    assert.equal(listeners.size, 1)

    mediaQuery.matches = true
    listeners.forEach((listener) => listener())
    assert.equal(getMobileViewportSnapshot(), true)
    assert.equal(notifications, 1)

    unsubscribe()
    assert.equal(listeners.size, 0)
    assert.ok(queryCalls >= 3)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
