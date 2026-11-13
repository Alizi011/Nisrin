import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parsePublicCatalog } from '../src/services/nisrinCatalog.ts'

const base = 'https://api.nisrin.no'
const good = {
  products: [{
    dbId: 42, id: null, name: 'Arganolje', subtitle: 'Ren olje',
    description: 'Produktbeskrivelse', ingredients: 'Argan', usage: 'Bruk',
    category: 'Olje', image: '/images/argan.jpg',
    variants: [
      { sku: 'ARG-30', label: '30 ml', priceOre: 12950, availableQty: 7 },
      { sku: 'ARG-50', label: '50 ml', priceOre: 19900, availableQty: 0 },
    ],
  }],
}

test('database catalog keeps stable DB ID, real SKU, øre-prices and same-origin images', () => {
  const [p] = parsePublicCatalog(good, base)
  assert.equal(p.id, 'db-42')
  assert.equal(p.price, 129.5)
  assert.equal(p.variants[0].price, 129.5)
  assert.equal(p.variants[1].sku, 'ARG-50')
  assert.equal(p.variants[0].availableQty, 7)
  assert.equal(p.variants[1].availableQty, 0)
  assert.equal(p.image, 'https://api.nisrin.no/images/argan.jpg')
  assert.deepEqual(p.reviews, [])
  assert.equal(p.rating, 0)
})

test('empty approved catalog stays empty; never loads sample products', () => {
  assert.deepEqual(parsePublicCatalog({ products: [] }, base), [])
})

test('unsafe external/data image URLs are never rendered', () => {
  for (const image of ['https://other.example/photo.jpg', 'data:image/svg+xml,evil', '//evil.example/a']) {
    assert.equal(parsePublicCatalog({
      products: [{ ...good.products[0], image }],
    }, base)[0].image, '')
  }
})

test('invalid or missing prices, SKU and duplicate variant labels fail closed', () => {
  for (const variants of [
    [{ sku: 'ARG-30', label: '30 ml', priceOre: 0, availableQty: 10 }],
    [{ sku: 'ARG-30', label: '30 ml', priceOre: 10.2, availableQty: 10 }],
    [{ sku: '', label: '30 ml', priceOre: 100, availableQty: 10 }],
    [
      { sku: 'ARG-30', label: '30 ml', priceOre: 100, availableQty: 10 },
      { sku: 'ARG-50', label: '30 ml', priceOre: 200, availableQty: 10 },
    ],
    [],
  ]) {
    assert.throws(() => parsePublicCatalog({
      products: [{ ...good.products[0], variants }],
    }, base))
  }
})

test('missing ID and malformed response fail closed; legacy ID is compatible', () => {
  assert.throws(() => parsePublicCatalog({
    products: [{ ...good.products[0], dbId: null, id: null }],
  }, base))
  assert.throws(() => parsePublicCatalog({ products: 'invalid' }, base))
  assert.equal(parsePublicCatalog({
    products: [{ ...good.products[0], dbId: null, id: 'argan-olje' }],
  }, base)[0].id, 'legacy-argan-olje')
})

test('duplicate products and SKUs across products fail closed', () => {
  assert.throws(() => parsePublicCatalog({
    products: [good.products[0], { ...good.products[0], dbId: 43 }],
  }, base))
  assert.throws(() => parsePublicCatalog({
    products: [good.products[0], good.products[0]],
  }, base))
})

test('inventory is mandatory: absent, negative, fractional and invented stock fail closed', () => {
  for (const availableQty of [undefined, null, -1, 1.5, 1000001, '10']) {
    assert.throws(() => parsePublicCatalog({
      products: [{
        ...good.products[0],
        variants: [{ sku: 'STOCK-1', label: '1 stk', priceOre: 15000, availableQty }],
      }],
    }, base))
  }
  assert.equal(parsePublicCatalog(good, base)[0].variants[1].availableQty, 0)
})
