import hero from '@/assets/hero.jpg'
import { EightStar } from '@/components/patterns'

export default function Hero() {
  return (
    <section id="topp" className="relative overflow-hidden">
      <div className="relative h-[86vh] min-h-[560px]">
        <img src={hero} alt="Marokkanske hudpleieprodukter mot zellige-fliser" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/75 via-espresso/20 to-espresso/10" />

        {/* Tekstpanel nederst til venstre */}
        <div className="absolute right-0 bottom-0 left-0">
          <div className="mx-auto max-w-7xl px-5 pb-14 md:px-10 md:pb-20">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-3 text-saffron">
                <EightStar className="h-5 w-5 animate-spin-slow" />
                <span className="text-[11px] font-bold tracking-[0.34em] uppercase">Fra Atlasfjellene til ditt bad</span>
              </div>
              <h1 className="font-display text-5xl leading-[0.95] font-semibold text-ivory md:text-7xl lg:text-[88px]">
                Skjønnhet
                <br />
                <em className="font-medium text-saffron">med sjel</em> fra
                <br />
                Marokko
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/85">
                Kaldpresset arganolje, rhassoul-leire og rosvann — tidløse ritualer fra hammamet, håndlaget av kooperativer
                i Marokko og levert til døren din i Norge.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#butikk"
                  className="bg-saffron px-8 py-3.5 text-[12px] font-bold tracking-[0.22em] text-espresso uppercase transition-all hover:-translate-y-0.5 hover:bg-ivory"
                >
                  Utforsk butikken
                </a>
                <a
                  href="#ritualer"
                  className="border border-ivory/70 px-8 py-3.5 text-[12px] font-bold tracking-[0.22em] text-ivory uppercase transition-all hover:bg-ivory hover:text-espresso"
                >
                  Våre ritualer
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zellige-bånd under hero */}
      <div className="zellige-band h-12 border-y border-majorelle/25 bg-ivory" aria-hidden="true" />
    </section>
  )
}
