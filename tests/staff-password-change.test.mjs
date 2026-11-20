import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const client = readFileSync(new URL('../src/services/nisrinAdminApi.ts', import.meta.url), 'utf8')
const admin = readFileSync(new URL('../src/pages/AdminPreview.tsx', import.meta.url), 'utf8')
const form = readFileSync(new URL('../src/pages/AdminPasswordPanel.tsx', import.meta.url), 'utf8')

test('staff password rotation uses current credential and server-owned session/CSRF', () => {
  assert.match(client, /export async function changeStaffPassword\(currentPassword: string, newPassword: string\)/)
  assert.match(client, /'\/auth\/staff\/password\/change'/)
  assert.match(client, /await request<\{ csrfToken: string \}>\('\/auth\/csrf'\)/)
  assert.match(client, /'X-CSRF-Token': csrfToken/)
  assert.match(client, /credentials: 'include'/)
  assert.match(client, /body: JSON\.stringify\(\{ currentPassword, newPassword \}\)/)
})

test('success requires server confirmation of password changed AND reauthentication', () => {
  assert.match(client, /result\.passwordChanged !== true \|\| result\.reauthenticationRequired !== true/)
  assert.match(form, /await changeStaffPassword\(currentPassword, newPassword\)/)
  assert.match(form, /onChanged\(\)/)
  assert.doesNotMatch(form, /localStorage|sessionStorage/)
  assert.match(form, /setCurrentPassword\(''\)/)
  assert.match(form, /setNewPassword\(''\)/)
})

test('every authenticated staff role can access the real form, never design preview', () => {
  assert.match(admin, /authenticated\s*\? \[\.\.\.visibleSections\(user\), \{ name: 'Kontoinnstillinger'/)
  assert.match(admin, /authenticated && selected === 'Kontoinnstillinger'/)
  assert.match(admin, /setUser\(null\)/)
  assert.match(admin, /økten er avsluttet/)
  assert.match(form, /type="password" required autoComplete="current-password"/)
  assert.match(form, /autoComplete="new-password"/)
})
