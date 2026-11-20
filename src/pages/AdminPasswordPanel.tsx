import { useState, type FormEvent } from 'react'
import { changeStaffPassword } from '@/services/nisrinAdminApi'

export default function AdminPasswordPanel({ onChanged }: { onChanged: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError('')
    if (newPassword !== confirmation) {
      setError('De nye passordene er ikke like.')
      return
    }
    if (currentPassword === newPassword) {
      setError('Det nye passordet må være forskjellig fra det gamle.')
      return
    }
    setPending(true)
    try {
      await changeStaffPassword(currentPassword, newPassword)
      // The server has revoked this login. Never show "changed" before confirmation.
      onChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Passordet kunne ikke endres.')
    } finally {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmation('')
      setPending(false)
    }
  }

  return (
    <section aria-label="Kontoinnstillinger" className="max-w-lg">
      <h4 className="mb-3 font-semibold">Endre eget passord</h4>
      <p className="mb-5 text-sm text-[#6d6255]">
        Bruk det midlertidige startpassordet du fikk fra administrator.
        E-post er ikke nødvendig. Når serveren har lagret endringen,
        avsluttes innloggingen og alle gamle økter blir ugyldige.
      </p>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <label className="block text-sm">Nåværende passord
          <input type="password" required autoComplete="current-password"
            value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={pending} maxLength={1024}
            className="mt-2 block w-full rounded-lg border bg-white px-3 py-2" />
        </label>
        <label className="block text-sm">Nytt passord (minst 12 tegn)
          <input type="password" required minLength={12} maxLength={1024} autoComplete="new-password"
            value={newPassword} onChange={(event) => setNewPassword(event.target.value)}
            disabled={pending}
            className="mt-2 block w-full rounded-lg border bg-white px-3 py-2" />
        </label>
        <label className="block text-sm">Gjenta nytt passord
          <input type="password" required minLength={12} maxLength={1024} autoComplete="new-password"
            value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
            disabled={pending}
            className="mt-2 block w-full rounded-lg border bg-white px-3 py-2" />
        </label>
        <button type="submit" disabled={pending}
          className="rounded-lg bg-[#30271e] px-5 py-3 text-sm text-white disabled:opacity-60">
          {pending ? 'Lagrer sikkert …' : 'Bytt passord og logg ut'}
        </button>
      </form>
    </section>
  )
}
