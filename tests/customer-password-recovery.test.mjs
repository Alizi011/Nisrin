import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const api = readFileSync(new URL('../src/services/nisrinCustomerPasswordReset.ts', import.meta.url), 'utf8')
const sharedAuth = readFileSync(new URL('../src/services/nisrinEmailVerification.ts', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/pages/CustomerAccount.tsx', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('customer reset is server-confirmed and does not expose account existence', () => {
  assert.match(api, /parseForgotPassword\(await customerRequest\('\/auth\/customer\/password\/forgot'/)
  assert.match(api, /parsePasswordReset\(await customerRequest\('\/auth\/customer\/password\/reset'/)
  assert.match(api, /value as \{ requested\?: unknown \}\)\.requested !== true/)
  assert.match(api, /value as \{ passwordReset\?: unknown \}\)\.passwordReset !== true/)
})

test('password tokens are carried only in URL fragment and POST, with CSRF/session', () => {
  assert.match(api, /tokenFromFragment\(fragment\)/)
  assert.match(sharedAuth, /credentials: 'include'/)
  assert.match(sharedAuth, /'X-CSRF-Token': token!/)
  assert.match(page, /resetCustomerPassword\(window\.location\.hash, password\)/)
  assert.match(page, /window\.history\.replaceState\(null, '', window\.location\.pathname\)/)
  assert.match(app, /pathname === '\/konto\/tilbakestill'/)
})

test('guest can browse while recovery does not unlock the checkout', () => {
  assert.match(page, /Alle kan utforske NISRIN uten konto/)
  assert.match(page, /Ingen betaling kan gjennomføres nå/)
  assert.match(page, /Glemt passord\?/)
  assert.match(page, /Send tilbakestillingslenke/)
})
