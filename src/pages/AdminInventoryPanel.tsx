import { useEffect, useState, type FormEvent } from 'react'
import {
  getAdminInventory, setInventoryOnHand, type NisrinInventoryVariant,
} from '@/services/nisrinAdminApi'

/**
 * Physical stocktake only. No stock reservation, order or payment actions.
 * Mounted solely in authenticated admin/manager portal, never design preview.
 */
export default function AdminInventoryPanel() {
  const [variants, setVariants] = useState<NisrinInventoryVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<NisrinInventoryVariant | null>(null)
  const [onHand, setOnHand] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getAdminInventory()
      .then((result) => { if (active) setVariants(result) })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Kunne ikke hente lager.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function choose(entry: NisrinInventoryVariant) {
    setSelected(entry)
    setOnHand(entry.stockConfigured ? String(entry.onHand) : '0')
    setReason('')
    setError('')
    setNotice('')
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !selected) return
    const qty = Number(onHand)
    if (!/^(0|[1-9][0-9]*)$/.test(onHand) ||
        !Number.isSafeInteger(qty) || qty > 1000000 ||
        reason.trim().length < 3 || reason.length > 200) {
      setError('Oppgi heltallsbeholdning 0–1 000 000 og årsak på minst 3 tegn.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await setInventoryOnHand(selected.variantId, {
        onHand: qty,
        expectedVersion: selected.version,
        reason: reason.trim(),
      })
      setSelected(null)
      setVariants(await getAdminInventory())
      setNotice('Lageropptellingen er lagret og revisjonsført av NISRIN-serveren.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Lagerendringen ble ikke bekreftet.')
      // Re-read for safe resolution of conflict; do not auto-resubmit.
      try {
        setVariants(await getAdminInventory())
        setSelected(null)
      } catch {
        setError('Kunne ikke oppdatere lageroversikten. Last siden på nytt før ny opptelling.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p role="status" className="text-sm">Henter lager fra NISRIN-API …</p>

  return (
    <div className="space-y-4 text-sm">
      <p className="text-[#6d6255]">
        Fysisk lageropptelling per SKU. Manglende opptelling betyr <strong>ukjent</strong>,
        ikke tilgjengelig. Salg og betalingsbehandling er ikke aktivert.
      </p>
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-900">{error}</p>}
      {notice && <p role="status" className="rounded border border-green-300 p-3">{notice}</p>}
      {variants.length === 0 && !error && <p>Ingen varianter registrert.</p>}
      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] border-collapse text-left">
            <thead><tr className="border-b">
              <th className="p-2">Produkt / SKU</th>
              <th className="p-2">På lager</th>
              <th className="p-2">Reservert</th>
              <th className="p-2">Tilgjengelig</th>
              <th className="p-2">Handling</th>
            </tr></thead>
            <tbody>{variants.map((entry) => (
              <tr key={entry.variantId} className="border-b align-top">
                <td className="p-2">
                  <strong>{entry.productName}</strong>
                  <p>{entry.variantLabel} · {entry.sku}</p>
                  <p className="text-xs text-[#6d6255]">
                    {entry.productStatus} / {entry.complianceStatus}
                  </p>
                </td>
                <td className="p-2">{entry.stockConfigured ? entry.onHand : 'Ukjent'}</td>
                <td className="p-2">{entry.stockConfigured ? entry.reserved : '—'}</td>
                <td className="p-2">{entry.stockConfigured ? entry.availableQty : 'Ukjent'}</td>
                <td className="p-2">
                  <button type="button" onClick={() => choose(entry)}
                    className="rounded border border-[#786454] px-3 py-2 hover:bg-[#f5eadb]">
                    Registrer opptelling
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {selected && (
        <form onSubmit={save} className="space-y-4 rounded-lg border p-4">
          <h4 className="font-semibold">Opptelling: {selected.productName} · {selected.sku}</h4>
          <p className="text-xs text-[#6d6255]">
            Versjon {selected.version}. Reservasjoner kan ikke justeres her.
            Lagret beholdning kan ikke være lavere enn reserverte varer.
          </p>
          <label className="block">
            Fysisk beholdning (antall)
            <input type="number" required min="0" max="1000000" step="1"
              value={onHand} disabled={saving}
              onChange={(event) => setOnHand(event.target.value)}
              className="mt-1 block w-full rounded border p-2" />
          </label>
          <label className="block">
            Årsak / opptellingsreferanse
            <input type="text" required minLength={3} maxLength={200}
              value={reason} disabled={saving}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 block w-full rounded border p-2"
              placeholder="Fysisk telling ved mottak" />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="rounded bg-[#443528] px-4 py-2 text-white disabled:opacity-50">
              {saving ? 'Lagrer …' : 'Lagre reell lageropptelling'}
            </button>
            <button type="button" disabled={saving} onClick={() => setSelected(null)}
              className="rounded border px-4 py-2">Avbryt</button>
          </div>
        </form>
      )}
      <p className="text-xs text-[#6d6255]">
        Lageret og katalogen forutsetter en særskilt, kontrollert NISRIN-databasemigrering.
        API-feil må undersøkes; ikke skriv inn oppdiktet lagerbeholdning.
      </p>
    </div>
  )
}
