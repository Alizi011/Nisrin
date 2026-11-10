import { useEffect, useState, type FormEvent } from 'react'
import {
  createStaff, getStaff, updateStaff,
  type NisrinStaffUser, type NisrinStaffRole,
} from '@/services/nisrinAdminApi'

const roleOptions: { value: NisrinStaffRole; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Butikksjef' },
  { value: 'seller', label: 'Butikkansatt' },
]

function roleLabel(role: NisrinStaffRole) {
  return roleOptions.find((item) => item.value === role)?.label ?? role
}

export default function AdminStaffPanel({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<NisrinStaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState<{
    name: string
    email: string
    role: NisrinStaffRole
    password: string
  }>({ name: '', email: '', role: 'seller', password: '' })

  useEffect(() => {
    let active = true
    getStaff()
      .then((list) => {
        if (active) setUsers(list)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Kunne ikke hente ansatte.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creating) return
    setError('')
    setSuccess('')
    setCreating(true)
    try {
      const user = await createStaff(form)
      setUsers((prev) => [user, ...prev])
      setSuccess(`${user.name} er opprettet. Del startpassordet på en sikker kanal.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kunne ikke opprette brukeren.')
    } finally {
      setForm((prev) => ({ ...prev, password: '' }))
      setCreating(false)
    }
  }

  async function handleUpdate(user: NisrinStaffUser, role: NisrinStaffRole, status: 'active' | 'disabled') {
    if (pendingId !== null || (user.id === currentUserId && (role !== 'admin' || status !== 'active'))) return
    setPendingId(user.id)
    setError('')
    setSuccess('')
    try {
      const updated = await updateStaff(user.id, { role, status })
      setUsers((prev) => prev.map((item) => item.id === updated.id ? updated : item))
      setSuccess(`${updated.name} er oppdatert.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kunne ikke oppdatere brukeren.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#6d6255]">
        Bare administratorer kan opprette og administrere ansatte. Kontoene lagres i NISRINs database.
        Ingen invitasjons-SMS eller e-post sendes automatisk ennå.
      </p>
      {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      {success && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</p>}

      <form onSubmit={handleCreate} className="rounded-lg border border-[#e8dfd4] p-4">
        <h4 className="mb-3 font-semibold">Opprett ansatt</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Navn
            <input required maxLength={160} autoComplete="name" value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 block w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">E-post
            <input required type="email" maxLength={254} autoComplete="off" value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 block w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">Rolle
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as NisrinStaffRole }))}
              className="mt-1 block w-full rounded-lg border px-3 py-2">
              {roleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-sm">Startpassord (minst 12 tegn)
            <input required minLength={12} maxLength={1024} type="password" autoComplete="new-password" value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 block w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <p className="mt-3 text-xs text-[#6d6255]">
          Administrator velger et unikt startpassord. Passordet lagres kun som hash på serveren.
          En egen sikker aktiveringsflyt skal erstatte manuell passordutdeling før lansering.
        </p>
        <button type="submit" disabled={creating}
          className="mt-4 rounded-lg bg-[#30271e] px-4 py-2 text-sm text-white disabled:opacity-60">
          {creating ? 'Oppretter …' : 'Opprett bruker'}
        </button>
      </form>

      <section aria-label="Ansatte">
        <h4 className="mb-3 font-semibold">Brukere og tilganger</h4>
        {loading ? (
          <p role="status" className="text-sm">Henter ansatte …</p>
        ) : users.length === 0 ? (
          <p className="text-sm">Ingen ansatte registrert.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border border-[#e8dfd4] p-3">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{user.name} {user.id === currentUserId && <span className="text-xs font-normal">(deg)</span>}</div>
                    <div className="text-xs text-[#6d6255]">{user.email}</div>
                  </div>
                  <span className="text-xs">{user.status === 'active' ? 'Aktiv' : 'Deaktivert'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs">Rolle
                    <select value={user.role}
                      disabled={pendingId !== null || user.id === currentUserId}
                      onChange={(event) => void handleUpdate(user, event.target.value as NisrinStaffRole, user.status)}
                      className="ml-2 rounded-lg border bg-white px-2 py-1.5 text-sm">
                      {roleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <button type="button" disabled={pendingId !== null || user.id === currentUserId}
                    onClick={() => void handleUpdate(user, user.role, user.status === 'active' ? 'disabled' : 'active')}
                    className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50">
                    {pendingId === user.id ? 'Lagrer …' : user.status === 'active' ? 'Deaktiver' : 'Aktiver'}
                  </button>
                  <span className="text-xs text-[#6d6255]">{roleLabel(user.role)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
