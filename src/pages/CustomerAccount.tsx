import { useEffect, useState, type FormEvent } from 'react'
import { getCustomerSession, loginCustomer, logoutCustomer, registerCustomer } from '@/services/nisrinCustomerAccount'
import type { NisrinUser } from '@/services/nisrinAdminApi'
import { confirmEmailVerification, getEmailVerified, requestEmailVerification, tokenFromFragment } from '@/services/nisrinEmailVerification'
import { forgotCustomerPassword, resetCustomerPassword } from '@/services/nisrinCustomerPasswordReset'

export default function CustomerAccount() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    window.location.pathname === '/konto/tilbakestill' ? 'reset' :
      window.location.pathname.startsWith('/konto/registrer') ? 'register' : 'login',
  )
  const [user, setUser] = useState<NisrinUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verified, setVerified] = useState<boolean | null>(null)
  const isConfirmationPage = window.location.pathname === '/konto/bekreft'

  useEffect(() => {
    let active = true
    getCustomerSession().then((current) => {
      if (active) setUser(current)
    }).catch(() => {
      if (active) setNotice('Pålogging er ennå ikke tilgjengelig. Du kan fortsatt se butikken som gjest.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    if (user) {
      getEmailVerified().then((status) => {
        if (active) setVerified(status)
      }).catch(() => {
        if (active) setVerified(null)
      })
    }
    return () => { active = false }
  }, [user])

  async function sendVerification() {
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      const alreadyVerified = await requestEmailVerification()
      if (alreadyVerified) {
        setVerified(true)
        setNotice('E-postadressen er allerede bekreftet.')
      } else {
        setNotice('Vi har sendt en bekreftelseslenke. Den er gyldig i 30 minutter.')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'E-postbekreftelse er ikke tilgjengelig.')
    } finally {
      setPending(false)
    }
  }

  async function confirmVerification() {
    const token = tokenFromFragment(window.location.hash)
    if (!token) {
      setError('Lenken mangler et gyldig bekreftelsestoken.')
      return
    }
    if (pending) return
    setPending(true)
    setError('')
    try {
      await confirmEmailVerification(token)
      setVerified(true)
      window.history.replaceState(null, '', window.location.pathname)
      setNotice('E-postadressen er bekreftet.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Bekreftelse mislyktes.')
    } finally {
      setPending(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'register') {
        await registerCustomer(name, email, password)
        setNotice('Kundekontoen ble registrert. E-postadressen er ikke verifisert, og kjøp er foreløpig ikke aktivert. Du kan logge inn.')
        setMode('login')
      } else if (mode === 'forgot') {
        await forgotCustomerPassword(email)
        setNotice('Hvis e-postadressen tilhører en verifisert kundekonto, får du en tilbakestillingslenke. Kontroller innboksen.')
        setMode('login')
      } else if (mode === 'reset') {
        await resetCustomerPassword(window.location.hash, password)
        window.history.replaceState(null, '', window.location.pathname)
        setUser(null)
        setVerified(null)
        setMode('login')
        setNotice('Passordet er oppdatert. Du kan logge inn med det nye passordet.')
      } else {
        const current = await loginCustomer(email, password)
        setUser(current)
      }
      setPassword('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tjenesten kunne ikke fullføre forespørselen.')
    } finally {
      setPending(false)
    }
  }

  async function signOut() {
    if (pending) return
    setPending(true)
    setError('')
    try {
      await logoutCustomer()
      setUser(null)
      setVerified(null)
      setPassword('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Utloggingen kunne ikke bekreftes.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-ink/15 bg-ivory px-5 py-5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <a href="/" className="font-display text-2xl font-semibold tracking-widest">NISRIN</a>
          <a href="/" className="text-sm underline underline-offset-4">Tilbake til butikken</a>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-5 py-12 md:py-20">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-rust uppercase">Min konto</p>
        <h1 className="font-display mt-3 text-center text-4xl font-semibold">
          {mode === 'reset' ? 'Opprett nytt passord' : user ? 'Min kundeside' : mode === 'register' ? 'Opprett kundekonto' : mode === 'forgot' ? 'Glemt passord' : 'Logg inn som kunde'}
        </h1>
        <p className="mt-5 text-center text-sm leading-relaxed text-ink/70">
          Alle kan utforske NISRIN uten konto. Når vi åpner for bestillinger, vil en kundekonto være nødvendig for å handle.
        </p>

        <div className="mt-8 border border-ink/20 bg-ivory p-6 sm:p-8">
          {notice && <p role="status" className="mb-5 border border-ink/20 bg-cream p-3 text-sm">{notice}</p>}
          {error && <p role="alert" className="mb-5 border border-rust/40 p-3 text-sm text-rust">{error}</p>}
          {loading ? (
            <p role="status">Kontrollerer konto …</p>
          ) : user && mode !== 'reset' ? (
            <div>
              <h2 className="font-display text-2xl">Velkommen, {user.name}</h2>
              <p className="mt-2 text-sm">{user.email}</p>
              <div className="mt-5 border border-ink/15 bg-cream p-4 text-sm">
                <p className="font-semibold">E-postadresse: {verified === true ? 'Bekreftet' : verified === false ? 'Ikke bekreftet' : 'Ikke kontrollert'}</p>
                {verified !== true && (
                  <div className="mt-3 space-y-3">
                    {isConfirmationPage && (
                      <button type="button" onClick={() => void confirmVerification()} disabled={pending}
                        className="w-full bg-espresso px-4 py-3 font-bold text-ivory disabled:opacity-50">
                        {pending ? 'Bekrefter …' : 'Bekreft e-postadressen min'}
                      </button>
                    )}
                    <button type="button" onClick={() => void sendVerification()} disabled={pending}
                      className="w-full border border-espresso px-4 py-3 font-semibold disabled:opacity-50">
                      {pending ? 'Kontakter server …' : 'Send bekreftelseslenke'}
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-5 border border-ink/15 bg-cream p-4 text-sm">
                Kontoen er logget inn. Ordrehistorikk, adresser og bestilling blir tilgjengelig etter at kunde- og ordresystemet er aktivert. Ingen betaling kan gjennomføres nå.
              </p>
              <button type="button" disabled={pending} onClick={() => void signOut()}
                className="mt-5 w-full border border-espresso px-4 py-3 text-sm font-bold disabled:opacity-50">
                {pending ? 'Logger ut …' : 'Logg ut'}
              </button>
            </div>
          ) : (
            <>
              {mode !== 'reset' && mode !== 'forgot' ? (
                <div className="mb-6 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setMode('login'); setError('') }}
                  aria-pressed={mode === 'login'}
                  className={mode === 'login' ? 'bg-espresso px-3 py-3 text-sm text-ivory' : 'border border-ink/25 px-3 py-3 text-sm'}>
                  Logg inn
                </button>
                <button type="button" onClick={() => { setMode('register'); setError('') }}
                  aria-pressed={mode === 'register'}
                  className={mode === 'register' ? 'bg-espresso px-3 py-3 text-sm text-ivory' : 'border border-ink/25 px-3 py-3 text-sm'}>
                  Ny kunde
                </button>
                </div>
              ) : (
                <button type="button" onClick={() => { setMode('login'); setError('') }}
                  className="mb-6 text-sm font-bold underline underline-offset-4">Tilbake til innlogging</button>
              )}
              <form onSubmit={(e) => void submit(e)} className="space-y-4">
                {mode === 'register' && (
                  <label className="block text-sm">Fullt navn
                    <input required maxLength={160} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                      disabled={pending} className="mt-2 block w-full border border-ink/30 bg-white px-3 py-3" />
                  </label>
                )}
                {mode !== 'reset' && <label className="block text-sm">E-postadresse
                  <input required type="email" maxLength={254} autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending}
                    className="mt-2 block w-full border border-ink/30 bg-white px-3 py-3" />
                </label>}
                {mode !== 'forgot' && <label className="block text-sm">{mode === 'reset' ? 'Nytt passord' : 'Passord'} {(mode === 'register' || mode === 'reset') && '(minst 12 tegn)'}
                  <input required type="password" minLength={mode === 'register' || mode === 'reset' ? 12 : undefined}
                    autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'}
                    value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending}
                    className="mt-2 block w-full border border-ink/30 bg-white px-3 py-3" />
                </label>}
                <button type="submit" disabled={pending}
                  className="w-full bg-espresso px-4 py-3 text-sm font-bold text-ivory disabled:opacity-50">
                  {pending ? 'Kontakter server …' : mode === 'register' ? 'Opprett konto' : mode === 'forgot' ? 'Send tilbakestillingslenke' : mode === 'reset' ? 'Lagre nytt passord' : 'Logg inn'}
                </button>
              </form>
              {mode === 'login' && (
                <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                  className="mt-4 text-sm font-semibold underline underline-offset-4">Glemt passord?</button>
              )}
              {isConfirmationPage && <p className="mt-4 text-sm text-rust">Logg inn med kundekontoen for å bekrefte e-postadressen.</p>}
              <p className="mt-5 text-xs text-ink/60">
                Registrering er ikke aktivert på produksjons-API-et ennå. Vi ber ikke om betalingsopplysninger.
              </p>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-sm">
          Ansatt eller butikksjef? <a className="underline underline-offset-4" href="/admin">Gå til ansattinnlogging</a>
        </p>
      </main>
    </div>
  )
}
