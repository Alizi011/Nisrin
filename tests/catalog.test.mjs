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

test('real legacy database image paths are resolved only to bundled Vite assets', () => {
  // Historical NISRIN rows contain source paths, not publicly reachable HTTP URLs.
  const filenames = [
    'argan-oil.jpg', 'prickly-pear.jpg', 'rhassoul-clay.jpg',
    'rose-water.jpg', 'beldi-soap.jpg', 'saffron-cream.jpg',
    'kessa-glove.jpg', 'orange-blossom.jpg', 'amber-perfume.jpg',
    'rose-lip.jpg', 'hammam-set.jpg', 'aker-fassi.jpg',
  ]
  const bundled = Object.fromEntries(filenames.map((filename, index) => [
    '/src/assets/' + filename, '/assets/fingerprinted-' + index + '.jpg',
  ]))
  for (const filename of filenames) {
    const path = 'src/assets/' + filename
    const [product] = parsePublicCatalog({
      products: [{ ...good.products[0], image: path }],
    }, base, bundled)
    assert.equal(product.image, bundled['/' + path])
    // Image resolution must never invent catalog pricing, approval or inventory.
    assert.equal(product.price, 129.5)
    assert.equal(product.variants[0].availableQty, 7)
    assert.equal(product.reviewCount, 0)
  }
  assert.equal(parsePublicCatalog({
    products: [{ ...good.products[0], image: 'src/assets/unknown.jpg' }],
  }, base, bundled)[0].image, '')
  for (const image of [
    'src/assets/../secrets.jpg',
    'src/assets/../../elsewhere.jpg',
    'src/assets/a.jpg?unsafe=1',
    'src/assets/a.svg',
    '//evil.example/a',
    'https://untrusted.example/a.jpg',
    'data:image/svg+xml,evil',
  ]) {
    assert.equal(parsePublicCatalog({
      products: [{ ...good.products[0], image }],
    }, base, bundled)[0].image, '')
  }
  assert.deepEqual(parsePublicCatalog({ products: [] }, base, bundled), [])
})
