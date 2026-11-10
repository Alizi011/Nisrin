import assert from "node:assert/strict"
import { test } from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { getSidebarSkeletonWidth } from "../src/components/ui/sidebar-skeleton-width.ts"

test("skeleton widths are deterministic, varied and between 50% and 89%", () => {
  const ids = Array.from({ length: 100 }, (_, index) => `:R${index}:`)
  const widths = ids.map(getSidebarSkeletonWidth)

  assert.deepEqual(widths, ids.map(getSidebarSkeletonWidth))
  assert.ok(new Set(widths).size > 1)
  widths.forEach((width) => assert.match(width, /^(?:[5-8][0-9])%$/))
})

test("React server markup keeps the same widths without Math.random", () => {
  function SkeletonWidths() {
    return React.createElement(
      "div",
      null,
      React.createElement("span", { style: { width: getSidebarSkeletonWidth(React.useId()) } }),
      React.createElement("span", { style: { width: getSidebarSkeletonWidth(React.useId()) } }),
    )
  }

  const previousRandom = Math.random
  Math.random = () => { throw new Error("Render must not use randomness") }
  try {
    const render = () => renderToStaticMarkup(React.createElement(SkeletonWidths))
    assert.equal(render(), render())
    assert.match(render(), /width:[5-8][0-9]%/)
  } finally {
    Math.random = previousRandom
  }
})
