import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Boxes, ClipboardList, LayoutDashboard, LockKeyhole, LogOut, Package, ShoppingBag, Users } from 'lucide-react'
import { getSession, login, logout, type NisrinUser } from '@/services/nisrinAdminApi'
import AdminProductsPanel from '@/pages/AdminProductsPanel'
import AdminInventoryPanel from '@/pages/AdminInventoryPanel'
import AdminStaffPanel from '@/pages/AdminStaffPanel'
import AdminOverviewPanel from '@/pages/AdminOverviewPanel'

const sections = [
  { name: 'Oversikt', description: 'Nøkkeltall og aktiviteter' },
  { name: 'Produkter', description: 'Katalog, varianter og priser' },
  { name: 'Varelager', description: 'Lagerbeholdning og varepartier' },
  { name: 'Bestillinger', description: 'Ordre og leveranser' },
  { name: 'Kunder', description: 'Kundeprofiler og adresser' },
  { name: 'Ansatte', description: 'Brukere og tilgangsstyring' },
  { name: 'Økonomi', description: 'Salg og regnskapsgrunnlag' },
] as const

function isStaff(user: NisrinUser | null): user is NisrinUser {
  return user !== null && user.roles.some((role) => ['admin', 'manager', 'seller'].includes(role))
}

function canReadProducts(user: NisrinUser): boolean {
  return user.roles.includes('admin') || user.roles.includes('manager')
}

function visibleSections(user: NisrinUser | null) {
  // Design preview has no live backend access.
  if (!user) return sections
  if (user.roles.includes('admin')) return sections
  if (user.roles.includes('manager')) {
    return sections.filter(({ name }) => !['Ansatte', 'Økonomi'].includes(name))
  }
  return sections.filter(({ name }) => ['Oversikt', 'Bestillinger'].includes(name))
}

export default function AdminPreview() {
  const [user, setUser] = useState<NisrinUser | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [preview, setPreview] = useState(false)
  const [selected, setSelected] = useState<string>('Oversikt')

  useEffect(() => {
    let active = true
    getSession()
      .then((result) => {
        if (!active) return
        if (result !== null && !isStaff(result)) {
          setError('Kontoen har ikke tilgang til butikkportalen.')
          return
        }
        setUser(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Kunne ikke kontrollere innloggingen.')
      })
      .finally(() => {
        if (active) setLoadingSession(false)
      })
    return () => { active = false }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || loadingSession) return
    setError('')
    setPending(true)
    try {
      const result = await login(email.trim(), password)
      setPassword('')
      if (!isStaff(result)) {
        setError('Kontoen har ikke tilgang til butikkportalen.')
        return
      }
      setPreview(false)
      setUser(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Innloggingen mislyktes.')
    } finally {
      setPending(false)
    }
  }

  async function handleLogout() {
    if (pending) return
    setPending(true)
    setError('')
    try {
      await logout()
      setUser(null)
      setPreview(false)
      setPassword('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Utloggingen mislyktes.')
    } finally {
      setPending(false)
    }
  }

  const authenticated = isStaff(user)
  const isAdmin = authenticated && user.roles.includes('admin')
  const accessibleSections = visibleSections(authenticated ? user : null)
  const showDashboard = authenticated || preview

  return (
    <div className="min-h-screen bg-[#f6f3ed] text-[#30271e]">
      <header className="border-b border-[#e8dfd4] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="font-serif text-2xl">NISRIN <span className="text-sm text-[#806c57]">/ Administrasjon</span></h1>
          <a href="/" className="flex items-center gap-2 text-sm hover:underline">
            <ArrowLeft size={16} aria-hidden="true" /> Til nettbutikken
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div role="status" className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <strong>Utviklingsversjon.</strong> Innlogging for butikkpersonalet er ennå ikke åpnet for offentlig tilgang.
          Produktoversikten er under utvikling og vil kun hente data ved godkjent innlogging. Øvrige moduler er designskisser.
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!showDashboard ? (
          <section className="mx-auto max-w-md rounded-xl border border-[#e8dfd4] bg-white p-7 shadow-sm">
            <LockKeyhole className="mb-4 text-[#8c7058]" size={26} aria-hidden="true" />
            <h2 className="mb-3 font-serif text-3xl">Logg inn</h2>
            <p className="mb-6 text-sm text-[#6d6255]">
              Sikker innlogging via NISRIN-API. Tilgangen er foreløpig sperret på serveren.
            </p>

            <form onSubmit={handleLogin}>
              <label className="mb-4 block text-sm">E-postadresse
                <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)}
                  disabled={pending || loadingSession} placeholder="navn@eksempel.no"
                  className="mt-2 block w-full rounded-lg border bg-white px-4 py-3 disabled:bg-gray-50" />
              </label>
              <label className="mb-5 block text-sm">Passord
                <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)}
                  disabled={pending || loadingSession} placeholder="••••••••"
                  className="mt-2 block w-full rounded-lg border bg-white px-4 py-3 disabled:bg-gray-50" />
              </label>
              <button type="submit" disabled={pending || loadingSession}
                className="w-full rounded-lg bg-[#30271e] p-3 text-white disabled:cursor-wait disabled:opacity-60">
                {loadingSession ? 'Kontrollerer tilgang …' : pending ? 'Logger inn …' : 'Logg inn'}
              </button>
            </form>

            <button type="button" onClick={() => { setPreview(true); setError('') }}
              className="mt-6 text-sm font-semibold text-[#846447] underline underline-offset-4">
              Se designskisse uten innlogging
            </button>
          </section>
        ) : (
          <section aria-label={authenticated ? 'Administrasjonsportalen' : 'Forhåndsvisning av administrasjonsportalen'}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-3xl">{authenticated ? 'Kontrollpanel' : 'Kontrollpanel – designskisse'}</h2>
                {authenticated && <p className="mt-1 text-sm text-[#6d6255]">
                  Innlogget som {user.name} · {isAdmin ? 'Administrator' : user.roles.includes('manager') ? 'Butikksjef' : 'Butikkansatt'}
                </p>}
              </div>
              {authenticated ? (
                <button type="button" disabled={pending} onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-60">
                  <LogOut size={16} aria-hidden="true" /> Logg ut
                </button>
              ) : (
                <button type="button" className="rounded-lg border bg-white px-4 py-2 text-sm"
                  onClick={() => setPreview(false)}>Tilbake til innlogging</button>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-[220px_1fr]">
              <nav aria-label="Administrasjonsmoduler" className="rounded-xl border bg-white p-3">
                {accessibleSections.map(({ name }) => (
                  <button type="button" key={name} onClick={() => setSelected(name)}
                    aria-current={selected === name ? 'page' : undefined}
                    className={`block w-full rounded-lg p-3 text-left text-sm ${selected === name ? 'bg-[#efe5d8] font-bold' : 'hover:bg-[#f6f3ed]'}`}>
                    {name}
                  </button>
                ))}
              </nav>
              <div>
                {!authenticated && (
                  <div className="mb-5 grid gap-3 sm:grid-cols-3">
                    {[
                      { name: 'Omsetning', Icon: ShoppingBag },
                      { name: 'Produkter', Icon: Package },
                      { name: 'Lager', Icon: Boxes },
                    ].map(({ name, Icon }) => (
                      <div key={name} className="rounded-xl border bg-white p-5">
                        <Icon size={20} className="mb-3" aria-hidden="true" />
                        <div className="text-sm">{name}</div>
                        <div className="mt-2 text-2xl">—</div>
                        <div className="text-xs text-gray-500">Designskisse – ingen levende data</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-xl border bg-white p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <LayoutDashboard size={20} aria-hidden="true" />
                    <h3 className="font-serif text-2xl">{selected}</h3>
                  </div>
                  {authenticated && canReadProducts(user) && selected === 'Oversikt' ? (
                    <AdminOverviewPanel />
                  ) : authenticated && canReadProducts(user) && selected === 'Produkter' ? (
                    <AdminProductsPanel />
                  ) : authenticated && canReadProducts(user) && selected === 'Varelager' ? (
                    <AdminInventoryPanel />
                  ) : isAdmin && selected === 'Ansatte' ? (
                    <AdminStaffPanel currentUserId={user.id} />
                  ) : (
                    <>
                      <p className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                        <Users size={17} aria-hidden="true" /> Ingen API-kall for denne modulen ennå.
                      </p>
                      <p className="flex items-center gap-2 rounded-lg bg-[#f6f3ed] p-4 text-sm">
                        <ClipboardList size={17} aria-hidden="true" /> {sections.find(item => item.name === selected)?.description}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
