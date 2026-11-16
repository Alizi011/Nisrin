import { useEffect, useState } from 'react'
import { getAdminOrderDrafts } from '@/services/nisrinAdminApi'
import type { NisrinOrderDraft } from '@/services/nisrinOrderDrafts'

function ore(value: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency', currency: 'NOK', minimumFractionDigits: 2,
  }).format(value / 100)
}

function expiresAt(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString('nb-NO', {
    dateStyle: 'short', timeStyle: 'short',
  })
}

/**
 * Read-only admin/manager review of server-persisted UNPAID reservations.
 * Never presents these as placed orders or as paid. No actions modify stock.
 * This panel is mounted only after a real NISRIN staff session is verified.
 */
export default function AdminOrderDraftsPanel() {
  const [before, setBefore] = useState<number | undefined>(undefined)
  const [version, setVersion] = useState(0)
  const [drafts, setDrafts] = useState<NisrinOrderDraft[]>([])
  const [nextBefore, setNextBefore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrievedAt, setRetrievedAt] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getAdminOrderDrafts(before)
      .then((result) => {
        if (!active) return
        setDrafts(result.drafts)
        setNextBefore(result.nextBefore)
        setRetrievedAt(Date.now())
      })
      .catch((cause: unknown) => {
        if (!active) return
        setDrafts([])
        setNextBefore(null)
        setError(cause instanceof Error ? cause.message : 'Kunne ikke hente ordreutkast fra serveren.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [before, version])

  function loadPage(cursor?: number) {
    if (loading) return
    setLoading(true)
    setError('')
    setDrafts([])
    setNextBefore(null)
    setBefore(cursor)
    setVersion((value) => value + 1)
  }

  return (
    <section className="space-y-5 text-sm" aria-label="Ubetalte ordreutkast">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <h4 className="font-semibold">Kun ubetalte ordreutkast – ingen gjennomførte bestillinger</h4>
        <p className="mt-2 leading-relaxed">
          Dette viser serverlagrede utkast og midlertidige lagerreservasjoner.
          Ingen betaling, frakt eller ordrebekreftelse er tilgjengelig.
          Varesubtotalen er ikke en endelig kjøpesum.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#6d6255]">
          {before === undefined ? 'Nyeste utkast' : `Utkast eldre enn #${before}`}
        </p>
        <button type="button" onClick={() => loadPage(before)} disabled={loading}
          className="rounded border px-4 py-2 disabled:opacity-50">
          {loading ? 'Henter …' : 'Oppdater fra server'}
        </button>
      </div>

      {loading ? (
        <p role="status">Henter ubetalte utkast fra NISRIN-API …</p>
      ) : error ? (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
          {error} Ingen lokal oversikt eller demodata vises.
        </p>
      ) : drafts.length === 0 ? (
        <p>Ingen ubetalte ordreutkast på denne siden.</p>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => {
            const overdue = draft.status === 'pending_payment' &&
              draft.expiresAt * 1000 <= retrievedAt
            const status = draft.status === 'expired'
              ? 'Utløpt (ikke betalt)'
              : overdue
                ? 'Utløpt tidspunkt – avventer serveropprydding'
                : 'Reservert – ubetalt'
            return (
              <article key={draft.orderDraftId} className="rounded-lg border p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">Utkast #{draft.orderDraftId}</h4>
                    <p className="mt-1 break-all text-[#6d6255]">{draft.contactEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{status}</p>
                    <p className="text-xs text-[#6d6255]">
                      Utløp: {expiresAt(draft.expiresAt)}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 border-t pt-3">
                  {draft.items.map((item) => (
                    <li key={item.sku} className="flex justify-between gap-2">
                      <span>{item.sku} × {item.quantity} ({ore(item.unitPriceOre)} per stk.)</span>
                      <span className="shrink-0">{ore(item.lineTotalOre)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex justify-between border-t pt-3 font-semibold">
                  <span>Varesubtotal, uten frakt</span>
                  <span>{ore(draft.subtotalOre)}</span>
                </p>
              </article>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {before !== undefined && (
          <button type="button" disabled={loading} onClick={() => loadPage()}
            className="rounded border px-4 py-2 disabled:opacity-50">
            Til nyeste
          </button>
        )}
        {!loading && !error && nextBefore !== null && (
          <button type="button" onClick={() => loadPage(nextBefore)}
            className="rounded border px-4 py-2 hover:bg-[#f6f3ed]">
            Vis eldre utkast
          </button>
        )}
      </div>
      <p className="text-xs text-[#6d6255]">
        Kundekontakt er personopplysninger og skal bare vises til autorisert personale.
        Ekte ordrebehandling og betaling krever separat sikkerhetsgodkjent integrasjon.
      </p>
    </section>
  )
}
