import { useRef, useState } from 'react'
import { formatPrice } from '@/data/products'
import { useShop } from '@/store/ShopContext'
import { cancelUnpaidDraft, checkoutLines, createUnpaidDraft } from '@/services/nisrinCheckoutDraft'
import type { UnpaidDraft } from '@/services/nisrinCheckoutDraft'
import { fetchShippingQuote } from '@/services/nisrinShippingQuote'
import type { ShippingQuote } from '@/services/nisrinShippingQuote'

/**
 * A development-only integration preview. An unpaid inventory reservation is
 * NOT an accepted customer order and cannot be paid from this interface.
 */
export default function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, cart, products, subtotal, reloadCatalog } = useShop()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<UnpaidDraft | null>(null)
  const [cancelPending, setCancelPending] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [postalCode, setPostalCode] = useState('')
  const [quote, setQuote] = useState<ShippingQuote | null>(null)
  const [quotePending, setQuotePending] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null)
  const previewEnabled = import.meta.env.DEV && import.meta.env.VITE_NISRIN_ENABLE_DRAFT_CHECKOUT === 'true'

  if (!checkoutOpen) return null

  async function requestDraft() {
    if (pending || draft) return
    setPending(true)
    setError(null)
    setCancelled(false)
    setQuote(null)
    setQuoteError(null)
    try {
      const lines = checkoutLines(cart, products)
      const fingerprint = JSON.stringify([email.trim().toLowerCase(), lines])
      if (attempt.current?.fingerprint !== fingerprint) {
        attempt.current = { fingerprint, key: crypto.randomUUID() }
      }
      const result = await createUnpaidDraft(email, lines, attempt.current.key)
      setDraft(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Det oppstod en ukjent feil.')
    } finally {
      setPending(false)
    }
  }

  async function cancelDraft() {
    if (!draft || !attempt.current || cancelPending) return
    setCancelPending(true)
    setCancelError(null)
    try {
      await cancelUnpaidDraft(email, attempt.current.key)
      setDraft(null)
      setQuote(null)
      setQuoteError(null)
      attempt.current = null
      setCancelled(true)
      reloadCatalog()
    } catch (cause) {
      // Keep the draft visible after a network error or ambiguous response.
      // Never claim stock was released without an explicit backend response.
      setCancelError(cause instanceof Error ? cause.message : 'Kansellering ble ikke bekreftet.')
    } finally {
      setCancelPending(false)
    }
  }

  async function requestQuote() {
    if (!draft || !attempt.current || quotePending || cancelPending) return
    setQuotePending(true)
    setQuoteError(null)
    setQuote(null)
    try {
      const result = await fetchShippingQuote(email, attempt.current.key, postalCode,
        draft.orderDraftId, draft.subtotalOre)
      setQuote(result)
    } catch (cause) {
      setQuoteError(cause instanceof Error ? cause.message : 'Frakt kunne ikke beregnes.')
    } finally {
      setQuotePending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center md:items-center md:p-6">
      <div className="drawer-overlay absolute inset-0 bg-espresso/70 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nisrin-checkout-heading"
        className="nice-scroll relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-y-auto bg-ivory"
      >
        <div className="zellige-band h-8 border-b border-majorelle/25" aria-hidden="true" />
        <button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Lukk kassen"
          className="absolute top-12 right-4 p-1 text-lg hover:text-rust">✕</button>
        <div className="px-6 py-8 md:px-10">
          <h2 id="nisrin-checkout-heading" className="font-display text-3xl font-semibold">Handlekurven din</h2>
          <div role="status" className="mt-6 border border-amber-600/35 bg-cream p-5">
            <p className="font-semibold">Bestilling og betaling er ikke åpnet</p>
            <p className="mt-2 text-sm leading-relaxed">
              Varer og priser i handlekurven er foreløpige. Ingen betalingsløsning er aktivert,
              og dette er ikke en godkjent bestillings- eller betalingsbekreftelse.
            </p>
          </div>
          <div className="mt-6 bg-cream/70 p-5">
            <p className="mb-3 text-[11px] font-bold tracking-[0.2em] uppercase">Din handlekurv</p>
            {cart.length === 0 ? <p className="text-sm">Handlekurven er tom.</p> :
              cart.map((item) => {
                const product = products.find((p) => p.id === item.productId)
                const variant = product?.variants.find((v) => v.label === item.variantLabel)
                if (!product || !variant) return null
                return (
                  <div key={`${item.productId}-${item.variantLabel}`} className="flex justify-between gap-3 py-2 text-sm">
                    <span>{product.name} · {item.variantLabel} × {item.qty}</span>
                    <span className="shrink-0">{formatPrice(variant.price * item.qty)}</span>
                  </div>
                )
              })}
            <div className="mt-3 space-y-1 border-t border-ink/15 pt-3 text-sm">
              <div className="flex justify-between"><span>Delsum</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span>Frakt</span><span>Ikke beregnet</span></div>
              <p className="border-t border-ink/15 pt-2 text-xs">Ingen totalpris kan bekreftes før serveren har beregnet frakt.</p>
            </div>
          </div>

          {previewEnabled && !draft && (
            <div className="mt-6 border border-ink/20 p-5">
              <p className="font-semibold">Utviklertest: reserver et ubetalt ordreutkast</p>
              <p className="mt-2 text-sm">Dette reserverer lager i backend i inntil 15 minutter dersom API-et er aktivert. Ingen ordre bekreftes, og ingen betaling skjer.</p>
              <form onSubmit={(event) => { event.preventDefault(); void requestDraft() }} className="mt-4 space-y-3">
                <label className="block text-sm" htmlFor="nisrin-draft-email">E-postadresse for testen</label>
                <input id="nisrin-draft-email" type="email" required maxLength={254} autoComplete="email"
                  value={email} onChange={(event) => setEmail(event.target.value)}
                  className="w-full border border-ink/30 bg-white px-3 py-2" />
                {error && <p role="alert" className="text-sm text-rust">{error} <button type="button" onClick={reloadCatalog} className="underline">Oppdater produktkatalog</button></p>}
                <button type="submit" disabled={pending || cart.length === 0}
                  className="w-full bg-espresso px-4 py-3 text-sm text-ivory disabled:opacity-40">
                  {pending ? 'Kontakter server …' : 'Opprett ubetalt testutkast'}
                </button>
              </form>
            </div>
          )}
          {cancelled && (
            <p role="status" className="mt-6 border border-ink/20 bg-cream p-5 text-sm">
              Serveren bekreftet at den ubetalte lagerreservasjonen er kansellert. Ingen bestilling ble fullført eller betalt.
            </p>
          )}
          {draft && (
            <div role="status" className="mt-6 border border-ink/20 bg-cream p-5 text-sm">
              <p className="font-semibold">Ubetalt lagerreservasjon #{draft.orderDraftId}</p>
              <p>Serverberegnet varesum: {formatPrice(draft.subtotalOre / 100)}. Frakt er ikke beregnet.</p>
              <p>Reservasjonen utløper: {new Date(draft.expiresAt * 1000).toLocaleString('nb-NO')}.</p>
              {previewEnabled && (
                <div className="mt-4 border-t border-ink/20 pt-4">
                  <p className="font-semibold">Utviklertest: serverberegnet frakt</p>
                  <p className="mt-1">Kun foreløpig pris. Ingen fraktbestilling eller adresse lagres.</p>
                  <form onSubmit={(event) => { event.preventDefault(); void requestQuote() }} className="mt-3 space-y-2">
                    <label htmlFor="nisrin-postal-code" className="block">Norsk postnummer</label>
                    <input id="nisrin-postal-code" type="text" inputMode="numeric" maxLength={4}
                      pattern="[0-9]{4}" required value={postalCode}
                      onChange={(event) => { setPostalCode(event.target.value); setQuote(null); setQuoteError(null) }}
                      className="w-full border border-ink/30 bg-white px-3 py-2" />
                    <button type="submit" disabled={quotePending || cancelPending}
                      className="w-full border border-espresso px-4 py-3 font-semibold disabled:opacity-40">
                      {quotePending ? 'Kontakter server …' : 'Hent foreløpig fraktpris'}
                    </button>
                  </form>
                  {quoteError && <p role="alert" className="mt-3 text-rust">{quoteError}</p>}
                  {quote && (
                    <div role="status" className="mt-3 space-y-1">
                      <p>Varesum fra server: {formatPrice(quote.subtotalOre / 100)}</p>
                      <p>Frakt fra server: {formatPrice(quote.shippingOre / 100)}</p>
                      <p className="font-semibold">Foreløpig total: {formatPrice(quote.totalOre / 100)}</p>
                      <p>Dette er ikke en betaling eller bekreftet ordre.</p>
                    </div>
                  )}
                </div>
              )}
              <p className="mt-2 font-semibold">Ingen betaling, ingen bekreftet ordre og ingen ordrebekreftelse.</p>
              {previewEnabled && (
                <>
                  {cancelError && <p role="alert" className="mt-3 text-rust">{cancelError}</p>}
                  <button type="button" onClick={() => void cancelDraft()} disabled={cancelPending}
                    className="mt-4 w-full border border-espresso px-4 py-3 font-semibold disabled:opacity-40">
                    {cancelPending ? 'Ber serveren avbryte …' : 'Avbryt ubetalt reservasjon'}
                  </button>
                </>
              )}
            </div>
          )}
          <button type="button" onClick={() => setCheckoutOpen(false)}
            className="mt-6 w-full bg-espresso py-4 text-[12px] font-bold tracking-[0.24em] text-ivory uppercase hover:bg-rust">
            Tilbake til nettbutikken
          </button>
        </div>
      </div>
    </div>
  )
}
