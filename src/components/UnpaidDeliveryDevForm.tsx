import { useState } from 'react'
import { formatPrice } from '@/data/products'
import type { UnpaidDraft } from '@/services/nisrinCheckoutDraft'
import { saveUnpaidDelivery } from '@/services/nisrinUnpaidDelivery'
import type { DeliveryDetails, SavedUnpaidDelivery } from '@/services/nisrinUnpaidDelivery'

/**
 * Strictly development-only component. Caller must also gate mounting
 * with import.meta.env.DEV and VITE_NISRIN_ENABLE_DRAFT_CHECKOUT.
 * Use synthetic delivery data; no order, payment or shipping is booked.
 */
export default function UnpaidDeliveryDevForm({
  draft, email, requestKey, postalCode, saving, onSavingChange,
}: {
  draft: UnpaidDraft
  email: string
  requestKey: string
  postalCode: string
  saving: boolean
  onSavingChange: (value: boolean) => void
}) {
  const [details, setDetails] = useState<Omit<DeliveryDetails, 'postalCode'>>({
    name: '', addressLine1: '', addressLine2: '', city: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedUnpaidDelivery | null>(null)

  const update = (field: keyof typeof details, value: string) => {
    setDetails((previous) => ({ ...previous, [field]: value }))
    setSaved(null)
    setError(null)
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    onSavingChange(true)
    setError(null)
    setSaved(null)
    try {
      const result = await saveUnpaidDelivery(
        email, requestKey, { ...details, postalCode },
        draft.orderDraftId, draft.subtotalOre, draft.expiresAt,
      )
      setSaved(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kunne ikke lagre testadressen.')
    } finally {
      onSavingChange(false)
    }
  }

  return (
    <section aria-labelledby="nisrin-dev-delivery-title" className="mt-4 border-t border-ink/20 pt-4">
      <h3 id="nisrin-dev-delivery-title" className="font-semibold">Utviklertest: leveringsopplysninger</h3>
      <p className="mt-2 text-sm">
        Bruk kun fiktive testopplysninger. Dette lagrer en midlertidig adresse på et
        ubetalt ordreutkast i testmiljøet. Ingen bestilling, betaling eller frakt bestilles.
      </p>
      <form onSubmit={(event) => { void save(event) }} className="mt-3 space-y-3">
        <label className="block text-sm" htmlFor="nisrin-delivery-name">Testmottaker</label>
        <input id="nisrin-delivery-name" type="text" required maxLength={120}
          disabled={saving} autoComplete="off" value={details.name}
          onChange={(event) => update('name', event.target.value)}
          className="w-full border border-ink/30 bg-white px-3 py-2" />

        <label className="block text-sm" htmlFor="nisrin-delivery-street">Testgateadresse</label>
        <input id="nisrin-delivery-street" type="text" required maxLength={160}
          disabled={saving} autoComplete="off" value={details.addressLine1}
          onChange={(event) => update('addressLine1', event.target.value)}
          className="w-full border border-ink/30 bg-white px-3 py-2" />

        <label className="block text-sm" htmlFor="nisrin-delivery-extra">Adresse tillegg (valgfritt)</label>
        <input id="nisrin-delivery-extra" type="text" maxLength={160}
          disabled={saving} autoComplete="off" value={details.addressLine2}
          onChange={(event) => update('addressLine2', event.target.value)}
          className="w-full border border-ink/30 bg-white px-3 py-2" />

        <label className="block text-sm" htmlFor="nisrin-delivery-city">Testpoststed</label>
        <input id="nisrin-delivery-city" type="text" required maxLength={100}
          disabled={saving} autoComplete="off" value={details.city}
          onChange={(event) => update('city', event.target.value)}
          className="w-full border border-ink/30 bg-white px-3 py-2" />

        <p>Postnummer: <strong>{postalCode}</strong> (fra frakttesten)</p>
        <button type="submit" disabled={saving}
          className="w-full border border-espresso px-4 py-3 font-semibold disabled:opacity-40">
          {saving ? 'Lagrer testadresse …' : 'Lagre testlevering på ubetalt utkast'}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-rust">{error}</p>}
      {saved && (
        <div role="status" className="mt-3 space-y-1 bg-cream p-3 text-sm">
          <p className="font-semibold">Serveren bekreftet lagring av testadresse.</p>
          <p>Varesum: {formatPrice(saved.subtotalOre / 100)}</p>
          <p>Frakt: {formatPrice(saved.shippingOre / 100)}</p>
          <p>Foreløpig total: {formatPrice(saved.totalOre / 100)}</p>
          <p>Fortsatt ubetalt: ingen ordre eller fraktbestilling er bekreftet.</p>
        </div>
      )}
    </section>
  )
}
