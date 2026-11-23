import { useEffect, useState } from 'react'
import { getAdminInventory, type NisrinInventoryVariant } from '@/services/nisrinAdminApi'

const stockLabels: Record<NisrinInventoryVariant['stockIssue'], string> = {
  verified: 'Kontrollert i lagerjournal',
  unknown: 'Ikke registrert',
  expired_only: 'Kun utløpte varepartier',
  reconciliation_required: 'Avvik – må avstemmes',
}

/**
 * Read-only NISRIN stock ledger review for authenticated staff.
 * A former stocktake form wrote to nisrin_inventory, which does not exist on
 * the VPS. This view NEVER writes a stock quantity or approves a product.
 */
export default function AdminInventoryPanel() {
  const [variants, setVariants] = useState<NisrinInventoryVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    getAdminInventory()
      .then((result) => {
        if (!active) return
        setVariants(result)
        setError('')
      })
      .catch((cause: unknown) => {
        if (active) {
          setVariants([])
          setError(cause instanceof Error ? cause.message : 'Kunne ikke hente lagerjournal.')
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])

  return (
    <div className="space-y-4 text-sm">
      <p className="text-[#6d6255]">
        Lagerstatus leses fra NISRINs eksisterende varepartier, lagerbevegelser
        og reservasjoner. Uten kontrollerbare journalposter vises <strong>ukjent</strong>,
        aldri et oppdiktet lagerantall. Utgåtte varepartier teller ikke som tilgjengelige.
      </p>
      <p className="text-[#6d6255]">
        Lageropptelling og endringer er sperret inntil den virkelige lagerjournalen
        har fått en kontrollert, reviderbar skrivefunksjon. En lagerregistrering
        godkjenner heller ikke et produkt for salg.
      </p>
      <button type="button"
        onClick={() => { setLoading(true); setRefresh((previous) => previous + 1) }}
        disabled={loading}
        className="rounded border border-[#786454] px-3 py-2 hover:bg-[#f5eadb] disabled:opacity-50">
        {loading ? 'Henter lager …' : 'Oppdater lagerstatus'}
      </button>
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-900">{error}</p>}
      {!loading && variants.length === 0 && !error && <p>Ingen varianter registrert.</p>}
      {variants.length > 0 && !error && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead><tr className="border-b">
              <th className="p-2">Produkt / SKU</th>
              <th className="p-2">Journalstatus</th>
              <th className="p-2">Varepartier</th>
              <th className="p-2">På lager</th>
              <th className="p-2">Reservert</th>
              <th className="p-2">Tilgjengelig</th>
            </tr></thead>
            <tbody>{variants.map((entry) => (
              <tr key={entry.variantId} className="border-b align-top">
                <td className="p-2">
                  <strong>{entry.productName}</strong>
                  <p>{entry.variantLabel} · {entry.sku}</p>
                  <p className="text-xs text-[#6d6255]">
                    {entry.productStatus} / {entry.complianceStatus}
                    {!entry.isActive && ' · variant inaktiv'}
                  </p>
                </td>
                <td className="p-2">{stockLabels[entry.stockIssue]}</td>
                <td className="p-2">
                  {entry.lotCount}
                  {entry.expiredLotCount > 0 && (
                    <p className="text-xs text-[#6d6255]">
                      {entry.expiredLotCount} utløpt
                    </p>
                  )}
                </td>
                <td className="p-2">{entry.stockConfigured ? entry.onHand : 'Ukjent'}</td>
                <td className="p-2">{entry.stockConfigured ? entry.reserved : '—'}</td>
                <td className="p-2">{entry.stockConfigured ? entry.availableQty : 'Ukjent'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[#6d6255]">
        Dette er en lageroversikt, ikke ferdige bestillinger eller betalinger.
        Varelageret kan først endres gjennom en verifisert og revidert NISRIN-lagerfunksjon.
      </p>
    </div>
  )
}
