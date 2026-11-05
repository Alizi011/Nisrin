import { useState } from 'react'
import { ArrowLeft, Boxes, ClipboardList, LayoutDashboard, LockKeyhole, Package, ShoppingBag, Users } from 'lucide-react'

const sections = [
  { name: 'Oversikt', description: 'Nøkkeltall og aktiviteter' },
  { name: 'Produkter', description: 'Katalog, varianter og priser' },
  { name: 'Varelager', description: 'Lagerbeholdning og varepartier' },
  { name: 'Bestillinger', description: 'Ordre og leveranser' },
  { name: 'Kunder', description: 'Kundeprofiler og adresser' },
  { name: 'Økonomi', description: 'Salg og regnskapsgrunnlag' },
] as const

export default function AdminPreview() {
  const [preview, setPreview] = useState(false)
  const [selected, setSelected] = useState<string>('Oversikt')

  return (
    <div className="min-h-screen bg-[#f6f3ed] text-[#30271e]">
      <header className="border-b border-[#e8dfd4] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="font-serif text-2xl">NISRIN <span className="text-sm text-[#806c57]">/ Administrasjon</span></h1>
          <a href="/" className="flex items-center gap-2 text-sm hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Til nettbutikken</a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div role="status" className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <strong>Utviklingsvisning.</strong> Innlogging er ikke aktiv. Ingen kunde- eller lagerdata hentes fra databasen, og ingen endringer lagres.
        </div>
        {!preview ? (
          <section className="mx-auto max-w-md rounded-xl border border-[#e8dfd4] bg-white p-7 shadow-sm">
            <LockKeyhole className="mb-4 text-[#8c7058]" size={26} aria-hidden="true" />
            <h2 className="mb-3 font-serif text-3xl">Logg inn</h2>
            <p className="mb-6 text-sm text-[#6d6255]">Administratorkontoer kobles til NISRIN-API-et etter sikkerhetstesting.</p>
            <label className="mb-4 block text-sm">E-postadresse
              <input type="email" disabled placeholder="navn@eksempel.no" className="mt-2 block w-full rounded-lg border bg-gray-50 px-4 py-3" />
            </label>
            <label className="mb-5 block text-sm">Passord
              <input type="password" disabled placeholder="••••••••" className="mt-2 block w-full rounded-lg border bg-gray-50 px-4 py-3" />
            </label>
            <button type="button" disabled className="w-full cursor-not-allowed rounded-lg bg-gray-400 p-3 text-white">
              Innlogging ikke aktivert
            </button>
            <button type="button" onClick={() => setPreview(true)} className="mt-6 text-sm font-semibold text-[#846447] underline underline-offset-4">
              Se designskisse av kontrollpanelet
            </button>
          </section>
        ) : (
          <section aria-label="Forhåndsvisning av administrasjonsportalen">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-3xl">Kontrollpanel – designskisse</h2>
              <button type="button" className="rounded-lg border bg-white px-4 py-2 text-sm" onClick={() => setPreview(false)}>Tilbake</button>
            </div>
            <div className="grid gap-5 md:grid-cols-[220px_1fr]">
              <nav aria-label="Administrasjonsmoduler" className="rounded-xl border bg-white p-3">
                {sections.map(({ name }) => (
                  <button type="button" key={name} onClick={() => setSelected(name)}
                    aria-current={selected === name ? 'page' : undefined}
                    className={`block w-full rounded-lg p-3 text-left text-sm ${selected === name ? 'bg-[#efe5d8] font-bold' : 'hover:bg-[#f6f3ed]'}`}>
                    {name}
                  </button>
                ))}
              </nav>
              <div>
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
                      <div className="text-xs text-gray-500">Ingen levende data</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border bg-white p-6">
                  <div className="mb-3 flex items-center gap-2"><LayoutDashboard size={20} aria-hidden="true" /><h3 className="font-serif text-2xl">{selected}</h3></div>
                  <p className="mb-3 flex items-center gap-2 text-sm text-gray-600"><Users size={17} aria-hidden="true" /> Ingen aktive API-kall eller lagring.</p>
                  <p className="flex items-center gap-2 rounded-lg bg-[#f6f3ed] p-4 text-sm"><ClipboardList size={17} aria-hidden="true" /> {sections.find(item => item.name === selected)?.description}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
