import { useState } from 'react'
import { PRODUCTS, formatPrice } from '@/data/products'
import { useShop, type Order } from '@/store/ShopContext'
import { EightStar } from '@/components/patterns'

type Step = 1 | 2 | 3

export default function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, cart, subtotal, discount, shipping, total, placeOrder } = useShop()
  const [step, setStep] = useState<Step>(1)
  const [order, setOrder] = useState<Order | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    zip: '',
    city: '',
    card: '',
    expiry: '',
    cvc: '',
  })

  if (!checkoutOpen) return null

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const step1Valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.address.trim() && form.zip.trim() && form.city.trim()
  const step2Valid = form.card.replace(/\s/g, '').length >= 12 && form.expiry.trim() && form.cvc.trim().length >= 3

  const close = () => {
    setCheckoutOpen(false)
    setStep(1)
    setOrder(null)
  }

  const pay = () => {
    const o = placeOrder(form.email)
    setOrder(o)
    setStep(3)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center md:items-center md:p-6">
      <div className="drawer-overlay absolute inset-0 bg-espresso/70 backdrop-blur-[2px]" onClick={step === 3 ? close : undefined} />
      <div className="nice-scroll relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-y-auto bg-ivory">
        <div className="zellige-band h-8 border-b border-majorelle/25" aria-hidden="true" />

        {step !== 3 && (
          <button onClick={close} aria-label="Lukk" className="absolute top-12 right-4 p-1 text-lg hover:text-rust">
            ✕
          </button>
        )}

        <div className="px-6 py-8 md:px-10">
          {/* Stegindikator */}
          {step !== 3 && (
            <>
              <h2 className="font-display text-3xl font-semibold">Kassen</h2>
              <div className="mt-5 flex items-center gap-2">
                {['Levering', 'Betaling'].map((label, i) => (
                  <div key={label} className="flex flex-1 items-center gap-2">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                        step > i ? 'border-rust bg-rust text-ivory' : 'border-ink/30 text-ink/50'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={`text-[11px] font-bold tracking-[0.14em] uppercase ${step > i ? '' : 'text-ink/40'}`}>
                      {label}
                    </span>
                    {i === 0 && <span className="mx-1 h-px flex-1 bg-ink/20" />}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <div className="mt-7 space-y-4">
              <input className="input-line" placeholder="Fullt navn" value={form.name} onChange={set('name')} />
              <input className="input-line" type="email" placeholder="E-post" value={form.email} onChange={set('email')} />
              <input className="input-line" placeholder="Adresse" value={form.address} onChange={set('address')} />
              <div className="grid grid-cols-3 gap-4">
                <input className="input-line" placeholder="Postnr." value={form.zip} onChange={set('zip')} />
                <input className="input-line col-span-2" placeholder="Poststed" value={form.city} onChange={set('city')} />
              </div>
              <button
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="mt-2 w-full bg-espresso py-4 text-[12px] font-bold tracking-[0.24em] text-ivory uppercase transition-colors hover:bg-rust disabled:cursor-not-allowed disabled:opacity-40"
              >
                Fortsett til betaling
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="mt-7">
              <div className="space-y-4">
                <input
                  className="input-line"
                  inputMode="numeric"
                  placeholder="Kortnummer (demo — bruk f.eks. 4242 4242 4242 4242)"
                  value={form.card}
                  onChange={set('card')}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input className="input-line" placeholder="MM/ÅÅ" value={form.expiry} onChange={set('expiry')} />
                  <input className="input-line" inputMode="numeric" placeholder="CVC" value={form.cvc} onChange={set('cvc')} />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-ink/50">
                Dette er en demobutikk — ingen ekte betaling gjennomføres.
              </p>

              {/* Ordreoppsummering */}
              <div className="mt-6 bg-cream/70 p-5">
                <p className="mb-3 text-[11px] font-bold tracking-[0.2em] uppercase">Din bestilling</p>
                {cart.map((it) => {
                  const p = PRODUCTS.find((x) => x.id === it.productId)!
                  const v = p.variants.find((vv) => vv.label === it.variantLabel)!
                  return (
                    <div key={`${it.productId}-${it.variantLabel}`} className="flex justify-between py-1 text-sm">
                      <span>
                        {p.name} <span className="text-ink/50">· {it.variantLabel} × {it.qty}</span>
                      </span>
                      <span>{formatPrice(v.price * it.qty)}</span>
                    </div>
                  )
                })}
                <div className="mt-3 space-y-1 border-t border-ink/15 pt-3 text-sm">
                  <div className="flex justify-between text-ink/70">
                    <span>Delsum</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-rust">
                      <span>Rabatt (HAMMAM10)</span>
                      <span>−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink/70">
                    <span>Frakt</span>
                    <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-base font-bold">
                    <span>Totalt</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="border border-ink/30 px-6 py-4 text-[12px] font-bold tracking-[0.2em] uppercase transition-colors hover:border-espresso"
                >
                  Tilbake
                </button>
                <button
                  disabled={!step2Valid}
                  onClick={pay}
                  className="flex-1 bg-rust py-4 text-[12px] font-bold tracking-[0.24em] text-ivory uppercase transition-colors hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Betal {formatPrice(total)}
                </button>
              </div>
            </div>
          )}

          {step === 3 && order && (
            <div className="py-6 text-center">
              <EightStar className="mx-auto h-14 w-14 animate-spin-slow text-saffron" />
              <h2 className="font-display mt-5 text-4xl font-semibold">Takk, shukran!</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Bestillingen din er mottatt. En bekreftelse er sendt til <strong>{order.email}</strong>.
                <br />
                Pakken sendes fra lageret vårt innen 1–2 virkedager.
              </p>
              <div className="mx-auto mt-6 max-w-sm bg-cream/70 p-5 text-left">
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase">Ordrenummer</p>
                <p className="font-display text-2xl font-semibold text-rust">{order.id}</p>
                <div className="mt-3 space-y-1 text-sm">
                  {order.items.map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {it.name} × {it.qty}
                      </span>
                      <span>{formatPrice(it.price * it.qty)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-ink/15 pt-2 font-bold">
                    <span>Totalt</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={close}
                className="mt-7 bg-espresso px-10 py-4 text-[12px] font-bold tracking-[0.24em] text-ivory uppercase transition-colors hover:bg-rust"
              >
                Fortsett å handle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
