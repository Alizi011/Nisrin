import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const shop = readFileSync(new URL('../src/components/ShopSection.tsx', import.meta.url), 'utf8')
const context = readFileSync(new URL('../src/store/ShopContext.tsx', import.meta.url), 'utf8')

test('dynamically loaded cards and editorial content stay visible', () => {
  assert.match(css, /\.reveal,\s*\.reveal\.is-visible\s*\{\s*opacity:\s*1;/)
  assert.doesNotMatch(css, /\.reveal\s*\{\s*opacity:\s*0/)
  assert.doesNotMatch(app, /useRevealObserver|IntersectionObserver/)
})

test('demo catalog still renders product cards after async request', () => {
  assert.match(context, /items\.length \? items : getDemoCatalog\(\)/)
  assert.match(shop, /products\.map\(\(p\) => <div key=\{p\.id\} className="reveal"/)
  assert.match(shop, /Demovisning – ingen produkter er til salgs ennå/)
})
