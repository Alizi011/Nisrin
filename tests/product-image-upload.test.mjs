import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { isDraftImageAcceptable, isPrivateMediaPath } from '../src/services/nisrinImagePolicy.ts'

const api = readFileSync(new URL('../src/services/nisrinAdminApi.ts', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/pages/AdminProductsPanel.tsx', import.meta.url), 'utf8')

test('only real image types and valid browser-side lengths pass initial guard', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(isDraftImageAcceptable({ type, size: 1234 }), true)
  }
  for (const type of ['image/svg+xml', 'application/pdf', 'text/html', 'application/octet-stream']) {
    assert.equal(isDraftImageAcceptable({ type, size: 1234 }), false)
  }
  for (const size of [0, -1, 4 * 1024 * 1024 + 1, 1.5, Number.NaN]) {
    assert.equal(isDraftImageAcceptable({ type: 'image/jpeg', size }), false)
  }
})

test('only random backend-owned relative media paths count as saved', () => {
  const path = '/media/' + 'f'.repeat(48) + '.png'
  assert.equal(isPrivateMediaPath(path), true)
  for (const untrusted of [
    '/media/../../etc/passwd', '/media/ab.jpg', '/media/' + 'f'.repeat(48) + '.php',
    '//evil.example/image.jpg', 'https://api.nisrin.no/media/1234.jpg',
    '/media/' + 'F'.repeat(48) + '.png', undefined, null, 12,
  ]) {
    assert.equal(isPrivateMediaPath(untrusted), false)
  }
})

test('real uploaded photo is sent as multipart with CSRF, not used to publish', () => {
  assert.match(api, /form\.append\('image', file\)/)
  assert.match(api, /method: 'POST'/)
  assert.match(api, /'X-CSRF-Token': csrfToken/)
  assert.match(api, /body: form/)
  assert.match(api, /result\.published !== false/)
  assert.match(api, /!isPrivateMediaPath\(result\.imagePath\)/)
  assert.doesNotMatch(api, /Content-Type['"]: 'multipart\/form-data'/)
  assert.match(page, /uploadDraftProductImage\(productId, file\)/)
  assert.match(page, /product\.status === 'draft' && product\.complianceStatus !== 'approved'/)
  assert.match(page, /Produktet er fortsatt ikke publisert eller godkjent/)
})
