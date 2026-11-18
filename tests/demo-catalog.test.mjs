import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Browser asset imports are intentionally compiled by Vite and cannot be loaded
// directly by Node's TS test loader. Assert the essential safeguards in source;
// the CI Vite build also typechecks and resolves every bundled image.
const demo = readFileSync(new URL('../src/data/demoCatalog.ts', import.meta.url), 'utf8')
const shop = readFileSync(new URL('../src/store/ShopContext.tsx', import.meta.url), 'utf8')
const section = readFileSync(new URL('../src/components/ShopSection.tsx', import.meta.url), 'utf8')
const card = readFileSync(new URL('../src/components/ProductCard.tsx', import.meta.url), 'utf8')
const modal = readFileSync(new URL('../src/components/ProductModal.tsx', import.meta.url), 'utf8')

test('demo items are explicitly identified, have no SKU and zero stock', () => {
  assert.match(demo, /isDemo: true/)
  assert.match(demo, /sku: undefined/)
  assert.match(demo, /availableQty: 0/)
  assert.match(demo, /reviewCount: 0/)
  assert.match(demo, /reviews: \[\]/)
  assert.match(demo, /badge: undefined/)
})

test('real API catalog takes precedence; fallback is display-only', () => {
  assert.match(shop, /items\.length \? items : getDemoCatalog\(\)/)
  assert.match(shop, /setProducts\(getDemoCatalog\(\)\)/)
  assert.match(shop, /if \(product\?\.isDemo\)/)
  assert.match(section, /Demovisning – ingen produkter er til salgs ennå/)
  assert.match(section, /Lagerbeholdning: 0/)
  assert.match(card, /Kun demo/)
  assert.match(modal, /disabled=\{product\.isDemo \|\|/)
})
