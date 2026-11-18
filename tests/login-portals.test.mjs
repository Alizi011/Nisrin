import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const auth = readFileSync(new URL('../src/services/nisrinAdminApi.ts', import.meta.url), 'utf8')
const customer = readFileSync(new URL('../src/services/nisrinCustomerAccount.ts', import.meta.url), 'utf8')
const staff = readFileSync(new URL('../src/pages/AdminPreview.tsx', import.meta.url), 'utf8')

test('customer and staff credentials use separate server authorization paths', () => {
  assert.match(auth, /portal === 'customer' \? '\/auth\/customer\/login' : '\/auth\/login'/)
  assert.match(customer, /login\(email, password, 'customer'\)/)
  assert.match(staff, /await login\(email\.trim\(\), password\)/)
})

test('portal login still obtains CSRF before posting credentials', () => {
  assert.match(auth, /await request<\{ csrfToken: string \}>\('\/auth\/csrf'\)/)
  assert.match(auth, /'X-CSRF-Token': csrfToken/)
  assert.match(auth, /credentials: 'include'/)
  assert.match(customer, /if \(!isCustomer\(user\)\)/)
  assert.match(customer, /await logout\(\)/)
})
