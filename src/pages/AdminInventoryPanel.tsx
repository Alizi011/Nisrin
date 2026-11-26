import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getAdminInventory, getInventoryWarehouses, createInventoryWarehouse, receiveInventoryLot, NisrinApiError,
  type NisrinInventoryVariant, type NisrinWarehouse } from '@/services/nisrinAdminApi'

const stockLabels: Record<NisrinInventoryVariant['stockIssue'], string> = {
  verified: 'Kontrollert i lagerjournal',
  unknown: 'Ikke registrert',
  expired_only: 'Kun utløpte varepartier',
  reconciliation_required: 'Avvik – må avstemmes',
}

/**
 * Review real NISRIN stock and receive new physical lots. No mirror writes,
 * arbitrary stock adjustment or product approval.
 */
export default function AdminInventoryPanel() {
  const [variants, setVariants] = useState<NisrinInventoryVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [warehouses, setWarehouses] = useState<NisrinWarehouse[]>([])
  const [warehouseLoading, setWarehouseLoading] = useState(true)
  const [warehouseError, setWarehouseError] = useState('')
  const [variantId, setVariantId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const [receiptError, setReceiptError] = useState('')
  const [receiptSuccess, setReceiptSuccess] = useState('')
  const [warehouseCode, setWarehouseCode] = useState('')
  const [warehouseName, setWarehouseName] = useState('')
  const [warehouseConfirmed, setWarehouseConfirmed] = useState(false)
  const [warehouseSaveError, setWarehouseSaveError] = useState('')
  const [warehouseSaveSuccess, setWarehouseSaveSuccess] = useState('')

  async function submitWarehouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || warehouseLoading || warehouseError || !warehouseConfirmed) return
    submitting.current = true
    setBusy(true)
    setWarehouseSaveError('')
    setWarehouseSaveSuccess('')
    try {
      const saved = await createInventoryWarehouse({ code: warehouseCode, name: warehouseName })
      setWarehouseSaveSuccess(`Lagersted ${saved.name} (${saved.code}) er registrert.`)
      setWarehouseId(String(saved.id))
      setConfirmed(false)
      setWarehouseCode('')
      setWarehouseName('')
    } catch (cause: unknown) {
      setWarehouseSaveError(cause instanceof NisrinApiError && cause.status === 409
        ? 'Lagerkoden finnes allerede. Kontroller listen, og bruk eksisterende lagersted.'
        : 'Registreringen er ikke bekreftet. Kontroller lagerstedslisten før nytt forsøk.')
    } finally {
      setWarehouseConfirmed(false)
      setWarehouseLoading(true)
      setLoading(true)
      setRefresh((previous) => previous + 1)
      submitting.current = false
      setBusy(false)
    }
  }

  useEffect(() => {
    let active = true
    getInventoryWarehouses()
      .then((result) => { if (active) { setWarehouses(result); setWarehouseError('') } })
      .catch(() => { if (active) { setWarehouses([]); setWarehouseError('Lagersteder kunne ikke hentes. Varemottak er utilgjengelig.') } })
      .finally(() => { if (active) setWarehouseLoading(false) })
    return () => { active = false }
  }, [refresh])

  async function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || loading || warehouseLoading || error || warehouseError || !confirmed ||
        !variants.some((v) => v.variantId === Number(variantId)) ||
        !warehouses.some((w) => w.id === Number(warehouseId)) ||
        !/^[1-9][0-9]*$/.test(quantity)) return
    submitting.current = true
    setBusy(true)
    setReceiptSuccess('')
    setReceiptError('')
    try {
      const lotId = await receiveInventoryLot({
        variantId: Number(variantId), warehouseId: Number(warehouseId),
        lotNumber, expiryDate: expiryDate || null, quantity: Number(quantity),
      })
      setReceiptSuccess(`Varemottak nr. ${lotId} er lagret. ${quantity} enheter registrert i lagerjournalen.`)
      setLotNumber('')
      setExpiryDate('')
      setQuantity('')
      setLoading(true)
      setWarehouseLoading(true)
      setRefresh((previous) => previous + 1)
    } catch (cause: unknown) {
      setReceiptError(cause instanceof NisrinApiError && cause.status === 409
        ? 'Varepartiet finnes allerede. Kontroller journalen før du gjør noe mer. Ikke bruk et nytt partinummer for samme mottak.'
        : 'Mottaket er ikke bekreftet. Kontroller journalen før nytt forsøk.')
    } finally {
      setConfirmed(false)
      submitting.current = false
      setBusy(false)
    }
  }

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
        Førstegangsmottak av et nytt fysisk vareparti registreres i lagerjournalen.
        Endring av eksisterende partier er fortsatt sperret. Varemottak godkjenner
        ikke produkter for salg.
      </p>
      <button type="button"
        onClick={() => { setLoading(true); setWarehouseLoading(true); setRefresh((previous) => previous + 1) }}
        disabled={loading || busy}
        className="rounded border border-[#786454] px-3 py-2 hover:bg-[#f5eadb] disabled:opacity-50">
        {loading ? 'Henter lager …' : 'Oppdater lagerstatus'}
      </button>
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-900">{error}</p>}
      {!loading && variants.length === 0 && !error && <p>Ingen varianter registrert.</p>}
      <form onSubmit={submitWarehouse} className="space-y-3 rounded border border-[#d5c9b9] p-4">
        <h3 className="font-semibold">Registrer faktisk lagersted</h3>
        <p>Registrer et fysisk lagersted med unik kode. Dette oppretter ingen varebeholdning.</p>
        {warehouseError && <p role="alert">{warehouseError}</p>}
        <fieldset disabled={busy || warehouseLoading || !!warehouseError} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">Lagerkode (A–Z, 0–9, _ eller -)
            <input required maxLength={40} value={warehouseCode}
              onChange={(e) => { setWarehouseCode(e.target.value.toUpperCase()); setWarehouseConfirmed(false) }} className="rounded border p-2" />
          </label>
          <label className="grid gap-1">Navn på lagersted
            <input required maxLength={150} value={warehouseName}
              onChange={(e) => { setWarehouseName(e.target.value); setWarehouseConfirmed(false) }} className="rounded border p-2" />
          </label>
          <label className="flex items-start gap-2 sm:col-span-2">
            <input type="checkbox" required checked={warehouseConfirmed} onChange={(e) => setWarehouseConfirmed(e.target.checked)} />
            Jeg bekrefter at dette er et faktisk lagersted, ikke et testlager.
          </label>
          <button type="submit" disabled={busy || !warehouseConfirmed} className="rounded border border-[#786454] px-3 py-2 disabled:opacity-50">
            Registrer lagersted
          </button>
        </fieldset>
        {warehouseSaveError && <p role="alert" className="text-red-900">{warehouseSaveError}</p>}
        {warehouseSaveSuccess && <p role="status">{warehouseSaveSuccess}</p>}
        {warehouses.length > 0 && <p>Registrerte lagersteder: {warehouses.map((w) => `${w.name} (${w.code})`).join(', ')}</p>}
      </form>
      <form onSubmit={submitReceipt} className="space-y-3 rounded border border-[#d5c9b9] p-4">
        <h3 className="font-semibold">Registrer nytt varemottak</h3>
        {warehouseError && <p role="alert">{warehouseError}</p>}
        {!warehouseLoading && !warehouseError && warehouses.length === 0 &&
          <p>Ingen lagersteder registrert. Et faktisk lagersted må opprettes før varemottak.</p>}
        <fieldset disabled={busy || loading || warehouseLoading || !!error || !!warehouseError || warehouses.length === 0 || variants.length === 0}
          className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">Produktvariant
            <select required value={variantId} onChange={(e) => { setVariantId(e.target.value); setConfirmed(false) }} className="rounded border p-2">
              <option value="">Velg variant</option>
              {variants.map((v) => <option key={v.variantId} value={v.variantId}>{v.productName} · {v.sku}</option>)}
            </select>
          </label>
          <label className="grid gap-1">Lagersted
            <select required value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setConfirmed(false) }} className="rounded border p-2">
              <option value="">Velg lagersted</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} · {w.code}</option>)}
            </select>
          </label>
          <label className="grid gap-1">Partinummer på varen
            <input required maxLength={100} value={lotNumber} onChange={(e) => { setLotNumber(e.target.value); setConfirmed(false) }} className="rounded border p-2" />
          </label>
          <label className="grid gap-1">Utløpsdato (dersom aktuelt)
            <input type="date" value={expiryDate} onChange={(e) => { setExpiryDate(e.target.value); setConfirmed(false) }} className="rounded border p-2" />
          </label>
          <label className="grid gap-1">Fysisk mottatt antall
            <input required type="number" min={1} max={1000000} step={1} value={quantity} onChange={(e) => { setQuantity(e.target.value); setConfirmed(false) }} className="rounded border p-2" />
          </label>
          <label className="flex items-start gap-2 sm:col-span-2">
            <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            Jeg har kontrollert det fysiske antallet og at dette er et nytt vareparti.
          </label>
          <button type="submit" disabled={!confirmed || busy} className="rounded border border-[#786454] px-3 py-2 disabled:opacity-50">
            {busy ? 'Registrerer …' : 'Registrer varemottak'}
          </button>
        </fieldset>
        {receiptError && <p role="alert" className="text-red-900">{receiptError}</p>}
        {receiptSuccess && <p role="status">{receiptSuccess}</p>}
      </form>
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
        Lagerregistrering er ikke produktgodkjenning, bestilling eller betaling.
      </p>
    </div>
  )
}
