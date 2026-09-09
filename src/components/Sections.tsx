import { useState } from 'react'
import { StarDivider, EightStar, WildRose } from '@/components/patterns'
import { Stars } from '@/components/ProductCard'

const TESTIMONIALS = [
  {
    text: 'Hammam-settet forandret søndagene mine. Hele badet lukter av eukalyptus, og huden har aldri vært glattere.',
    author: 'Kristine W.',
    place: 'Oslo',
    rating: 5,
  },
  {
    text: 'Kaktusfiken-serumet er det dyreste jeg har kjøpt til huden — og det eneste jeg har kjøpt på nytt. Tre ganger.',
    author: 'Live H.',
    place: 'Bergen',
    rating: 5,
  },
  {
    text: 'Som marokkaner i Norge var jeg skeptisk. Men arganoljen er den ekte varen — den lukter akkurat som hjemme.',
    author: 'Amine K.',
    place: 'Trondheim',
    rating: 5,
  },
  {
    text: 'Rosvannet har roet ned den sensitive huden min helt. Jeg sprayer til og med over makeup midt på dagen.',
    author: 'Yasmin A.',
    place: 'Stavanger',
    rating: 5,
  },
]

export function ReviewsSection() {
  return (
    <section id="anmeldelser" className="scroll-mt-24 border-y border-majorelle/25 bg-ivory py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="reveal mb-12 text-center">
          <p className="text-[11px] font-bold tracking-[0.34em] text-rust uppercase">Fra kundene våre</p>
          <h2 className="font-display mt-3 text-4xl font-semibold md:text-6xl">Ord som varmer</h2>
          <div className="mx-auto mt-6 max-w-xs">
            <StarDivider />
          </div>
        </div>
        <div className="grid gap-px overflow-hidden border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <figure key={t.author} className="reveal bg-ivory p-7" style={{ transitionDelay: `${i * 80}ms` }}>
              <Stars value={t.rating} />
              <blockquote className="font-display mt-4 text-lg leading-snug font-medium">«{t.text}»</blockquote>
              <figcaption className="mt-4 text-[11px] font-bold tracking-[0.2em] text-olive uppercase">
                {t.author} · {t.place}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  const submit = () => {
    if (/\S+@\S+\.\S+/.test(email)) {
      setDone(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <section className="relative overflow-hidden bg-majorelle py-16 text-ivory md:py-24">
      <div className="zellige-band-ivory absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl px-5 text-center">
        <EightStar className="mx-auto h-10 w-10 animate-spin-slow text-saffron" />
        <h2 className="font-display mt-5 text-4xl font-semibold md:text-5xl">Bli med i souken</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ivory/85">
          Ritualer, hudpleietips og tidlig tilgang til nye produkter — rett i innboksen din. Nye abonnenter får 10 % avslag
          på første bestilling.
        </p>
        {done ? (
          <p className="mx-auto mt-8 max-w-md border border-ivory/50 bg-ivory/10 px-6 py-4 text-sm font-bold tracking-[0.12em] uppercase">
            Velkommen! Koden HAMMAM10 er din.
          </p>
        ) : (
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(false)
              }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="E-postadressen din"
              className="flex-1 border-b border-ivory/60 bg-transparent px-1 py-3 text-sm text-ivory outline-none placeholder:text-ivory/50 focus:border-saffron"
            />
            <button
              onClick={submit}
              className="bg-saffron px-8 py-3 text-[12px] font-bold tracking-[0.22em] text-espresso uppercase transition-colors hover:bg-ivory"
            >
              Meld meg på
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-xs text-ivory">Skriv inn en gyldig e-postadresse.</p>}
      </div>
    </section>
  )
}

export function AboutSection() {
  return (
    <section id="om" className="scroll-mt-24 py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <div className="reveal">
          <p className="text-[11px] font-bold tracking-[0.34em] text-rust uppercase">Om Nisrin</p>
          <h2 className="font-display mt-3 text-4xl leading-tight font-semibold md:text-5xl">
            Fra soukene i Marrakech,
            <br />
            <em className="font-medium text-rust">med kjærlighet,</em> til Norge
          </h2>
          <div className="mx-auto mt-6 max-w-xs">
            <StarDivider />
          </div>
          <p className="mt-8 text-[15px] leading-relaxed text-ink/75">
            Nisrin — «villrose» på arabisk — ble til etter en reise gjennom Marokko der vi møtte kvinnene bak
            kooperativene i Agadir-regionen — hendene som presser arganoljen, plukker rosene og høster safranen. Vi
            jobber direkte med dem, uten mellomledd, slik at hver flaske bærer med seg både kvalitet og rettferdig handel.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/75">
            Alle produktene våre er rene, naturlige og håndlaget i små partier. Det tar lenger tid — og det er helt poenget.
          </p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-espresso text-ivory">
      <div className="zellige-band-ivory h-10 opacity-50" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <WildRose className="h-10 w-10 shrink-0 text-saffron" />
              <div>
                <p className="font-display text-3xl leading-none font-semibold tracking-[0.22em] uppercase">Nisrin</p>
                <p className="mt-1 text-[10px] font-bold tracking-[0.42em] text-ivory/50 uppercase">Marokkansk hudpleie</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/65">
              Autentiske marokkanske skjønnhetsritualer — arganolje, rhassoul, rosvann og hammam — levert fra vårt lager i
              Oslo.
            </p>
          </div>
          <div>
            <p className="mb-4 text-[11px] font-bold tracking-[0.24em] text-saffron uppercase">Butikk</p>
            <ul className="space-y-2.5 text-sm text-ivory/70">
              <li><a href="#butikk" className="transition-colors hover:text-saffron">Alle produkter</a></li>
              <li><a href="#ritualer" className="transition-colors hover:text-saffron">Hammam-ritualet</a></li>
              <li><a href="#ingredienser" className="transition-colors hover:text-saffron">Ingredienser</a></li>
              <li><a href="#anmeldelser" className="transition-colors hover:text-saffron">Anmeldelser</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-[11px] font-bold tracking-[0.24em] text-saffron uppercase">Kundeservice</p>
            <ul className="space-y-2.5 text-sm text-ivory/70">
              <li>Fri frakt over 600 kr</li>
              <li>Levering 2–4 virkedager</li>
              <li>30 dagers åpent kjøp</li>
              <li>post@nisrin.no</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ivory/15 pt-6 text-[11px] tracking-[0.14em] text-ivory/45 uppercase md:flex-row">
          <span>© 2026 Nisrin · Org.nr 923 456 789</span>
          <span>Håndlaget i Marokko · Pakket i Oslo</span>
        </div>
      </div>
    </footer>
  )
}
