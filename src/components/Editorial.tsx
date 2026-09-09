import ritual from '@/assets/ritual.jpg'
import ingredients from '@/assets/ingredients.jpg'
import { ArchFrame, StarDivider, EightStar } from '@/components/patterns'

const RITUAL_STEPS = [
  {
    n: '01',
    title: 'Rens med beldi',
    text: 'Den mørke olivensåpen mykgjør huden i varmen og forbereder den på skrubb.',
  },
  {
    n: '02',
    title: 'Skrubb med kessa',
    text: 'Den håndvevde hansken løfter bort døde hudceller og setter i gang sirkulasjonen.',
  },
  {
    n: '03',
    title: 'Masker med rhassoul',
    text: 'Leiren fra Atlasfjellene trekker ut urenheter og etterlater huden klar.',
  },
  {
    n: '04',
    title: 'Nær med argan',
    text: 'Avslutt med kaldpresset arganolje som segler inn fuktighet og glød.',
  },
]

export function RitualSection() {
  return (
    <section id="ritualer" className="scroll-mt-24 bg-espresso py-16 text-ivory md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="reveal relative">
            <ArchFrame src={ritual} alt="Hammam-ritual med beldi-såpe" className="mx-auto max-w-md" />
            <div className="zellige-band-ivory absolute -bottom-8 left-1/2 h-12 w-2/3 -translate-x-1/2 opacity-60" aria-hidden="true" />
          </div>
          <div className="reveal">
            <p className="text-[11px] font-bold tracking-[0.34em] text-saffron uppercase">Hammam-ritualet</p>
            <h2 className="font-display mt-3 text-4xl leading-[1.02] font-semibold md:text-6xl">
              Fire steg.
              <br />
              <em className="font-medium text-saffron">Tusen år</em> av visdom.
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ivory/75">
              Hammamet er Marokkos hjerte — et sted for renselse, ro og fellesskap. Vi har samlet ritualets fire steg slik
              at du kan gjenskape det hjemme, i ditt eget tempo.
            </p>
            <div className="mt-10 space-y-0">
              {RITUAL_STEPS.map((s) => (
                <div key={s.n} className="group flex gap-6 border-t border-ivory/15 py-5 transition-colors last:border-b hover:bg-ivory/5">
                  <span className="font-display text-2xl text-saffron/80">{s.n}</span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{s.title}</h3>
                    <p className="mt-1 max-w-md text-sm text-ivory/65">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const INGREDIENT_FACTS = [
  { title: 'Argan', text: '«Flytende gull» fra trær som bare vokser i Sørvest-Marokko. Presset for hånd av kvinnekooperativer.' },
  { title: 'Damaskrose', text: 'Håndplukket ved daggry i Rosendalen, når duften er på sitt sterkeste.' },
  { title: 'Safran', text: '150 000 blomster gir én kilo. Verdens dyreste krydder — og hudens beste venn.' },
  { title: 'Rhassoul', text: 'Mineralrik leire fra de samme årene som har forsynt hammamene i 1400 år.' },
]

export function IngredientsSection() {
  return (
    <section id="ingredienser" className="scroll-mt-24 py-16 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="reveal mb-12 text-center">
          <p className="text-[11px] font-bold tracking-[0.34em] text-rust uppercase">Fra jord til hud</p>
          <h2 className="font-display mt-3 text-4xl font-semibold md:text-6xl">Ingrediensene</h2>
          <div className="mx-auto mt-6 max-w-xs">
            <StarDivider />
          </div>
        </div>
        <div className="grid items-start gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="reveal lg:col-span-2">
            <ArchFrame src={ingredients} alt="Marokkanske ingredienser: argannøtter, roser, safran" className="mx-auto max-w-sm" />
          </div>
          <div className="grid gap-x-10 sm:grid-cols-2 lg:col-span-3">
            {INGREDIENT_FACTS.map((f, i) => (
              <div key={f.title} className="reveal border-t border-ink/15 py-6" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-3">
                  <EightStar className="h-5 w-5 text-majorelle" />
                  <h3 className="font-display text-2xl font-semibold">{f.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
