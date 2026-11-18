import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// The runtime service uses Vite environment and browser fetch; guard the
// pure parsing contract and route wiring via source-level checks in Node.
const service = readFileSync(new URL('../src/services/nisrinEmailVerification.ts', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/pages/CustomerAccount.tsx', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('customer verification is session/CSRF-backed and never claims success before server confirms', () => {
  assert.match(service, /credentials: 'include'/)
  assert.match(service, /'X-CSRF-Token': token!/)
  assert.match(service, /'\/auth\/customer\/verification\/status'/)
  assert.match(service, /'\/auth\/customer\/verification\/request'/)
  assert.match(service, /'\/auth\/customer\/verification\/confirm'/)
  assert.match(service, /parseCustomerEmailStatus\(data\) !== true/)
})

test('verification bearer token is read from URL fragment, not from query', () => {
  assert.match(service, /tokenFromFragment\(fragment: string\)/)
  assert.match(service, /new URLSearchParams\(value\)/)
  assert.match(service, /\^\[0-9a-f\]\{64\}\$/)
  assert.match(page, /window\.location\.hash/)
  assert.match(page, /window\.history\.replaceState\(null, '', window\.location\.pathname\)/)
  assert.match(app, /pathname === '\/konto\/bekreft'/)
})

test('customer cannot pay or order from email-verification page', () => {
  assert.match(page, /Ingen betaling kan gjennomføres nå/)
  assert.match(page, /Kundekontoen ble registrert\. E-postadressen er ikke verifisert/)
  assert.match(page, /E-postadresse: \{verified === true/)
})
