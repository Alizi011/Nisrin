import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const api = readFileSync(new URL('../src/services/nisrinAdminApi.ts', import.meta.url), 'utf8')
const view = readFileSync(new URL('../src/pages/AdminInventoryPanel.tsx', import.meta.url), 'utf8')

test('staff inventory loads the actual ledger API and validates stock balances', () => {
  assert.match(api, /request<\{ variants: NisrinInventoryVariant\[\] \}>\('\/admin\/inventory'\)/)
  assert.match(api, /entry\.stockIssue === 'verified'/)
  assert.match(api, /entry\.availableQty === entry\.onHand - entry\.reserved/)
  assert.match(api, /entry\.reserved <= entry\.onHand/)
  assert.match(api, /entry\.availableQty === null/)
  assert.match(api, /reconciliation_required/)
})

test('admin view exposes unknown, expired and reconciliation issues without false stock', () => {
  assert.match(view, /getAdminInventory\(\)/)
  assert.match(view, /Ukjent/)
  assert.match(view, /utløpte varepartier/)
  assert.match(view, /Avvik – må avstemmes/)
  assert.match(view, /entry\.stockConfigured \? entry\.availableQty : 'Ukjent'/)
})

test('unavailable inventory mirror cannot be written from frontend', () => {
  assert.doesNotMatch(api, /export async function setInventoryOnHand/)
  assert.doesNotMatch(view, /setInventoryOnHand/)
  assert.doesNotMatch(view, /Registrer opptelling/)
  assert.doesNotMatch(view, /Lagre reell lageropptelling/)
})

test('new physical lot receipts use real warehouse choices and CSRF, never the mirror', () => {
  assert.match(api, /'\/admin\/inventory\/warehouses'/)
  assert.match(api, /'\/admin\/inventory\/receipts'/)
  const receipt = api.slice(api.indexOf('export async function receiveInventoryLot'), api.indexOf('export async function getAdminOrderDrafts'))
  assert.match(receipt, /'X-CSRF-Token': csrfToken/)
  assert.match(receipt, /result\.receivedQuantity !== input\.quantity/)
  assert.match(view, /warehouses\.length === 0/)
  assert.match(view, /await receiveInventoryLot/)
  assert.match(view, /submitting\.current/)
  assert.match(view, /cause\.status === 409/)
  assert.match(view, /Kontroller journalen før nytt forsøk/)
})
