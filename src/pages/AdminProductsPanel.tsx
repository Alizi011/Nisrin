import { useEffect, useState, type FormEvent } from 'react'
import {
  getAdminProducts, updateDraftProduct, type NisrinAdminProduct,
  type NisrinProductDraftInput,
} from '@/services/nisrinAdminApi'

const money = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
})

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Aktiv'
    case 'draft': return 'Utkast'
    case 'approved': return 'Godkjent'
    case 'pending': return 'Venter på kontroll'
    default: return status
  }
}

export default function AdminProductsPanel() {
  const [products, setProducts] = useState<NisrinAdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<NisrinProductDraftInput | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const edit = (product: NisrinAdminProduct) => {
    if (product.status !== 'draft' || product.complianceStatus === 'approved') return
    setEditingId(product.id)
    setDraft({
      name: product.name,
      subtitle: product.subtitle,
      description: product.description,
      ingredients: product.ingredients,
      usage: product.usage,
      variants: product.variants.map(({ sku, priceOre }) => ({ sku, priceOre })),
    })
    setSaveError('')
    setSaveMessage('')
  }

  const saveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft || editingId === null || saving) return
    if (!draft.name.trim() || !draft.description.trim() ||
        draft.variants.some((v) => !Number.isSafeInteger(v.priceOre) || v.priceOre < 1 || v.priceOre > 100000000)) {
      setSaveError('Navn, beskrivelse og positive heltallspriser i øre er påkrevd.')
      return
    }
    setSaving(true)
    setSaveError('')
    setSaveMessage('')
    try {
      await updateDraftProduct(editingId, draft)
      setSaveMessage('Serveren bekreftet lagring av produktutkastet.')
      setEditingId(null)
      setDraft(null)
      try {
        setProducts(await getAdminProducts())
      } catch {
        setSaveError('Lagret, men kunne ikke oppdatere produktlisten. Last siden på nytt.')
      }
    } catch (cause: unknown) {
      setSaveError(cause instanceof Error ? cause.message : 'Lagringen ble ikke bekreftet av serveren.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let active = true

    getAdminProducts()
      .then((result) => {
        if (active) setProducts(result)
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Kunne ikke hente produktene.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  if (loading) {
    return <p role="status" className="text-sm text-[#6d6255]">Henter produkter fra NISRIN-API …</p>
  }

  if (error) {
    return <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</p>
  }

  if (products.length === 0) {
    return <p className="text-sm text-[#6d6255]">Ingen produkter registrert ennå.</p>
  }

  return (
    <div className="overflow-x-auto">
      <p className="mb-4 text-sm text-[#6d6255]">{products.length} produkter hentet fra NISRIN-API. Viser også utkast.</p>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="border-b border-[#e8dfd4] text-[#6d6255]">
          <tr>
            <th scope="col" className="p-3">Produkt</th>
            <th scope="col" className="p-3">Status</th>
            <th scope="col" className="p-3">Dokumentasjon</th>
            <th scope="col" className="p-3">Varianter</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-[#f0e8de] align-top">
              <td className="p-3">
                <div className="font-semibold">{product.name}</div>
                <div className="text-xs text-[#6d6255]">{product.category ?? 'Uten kategori'}</div>
                {product.status === 'draft' && product.complianceStatus !== 'approved' && (
                  <button type="button" onClick={() => edit(product)}
                    className="mt-2 rounded border border-[#786454] px-3 py-1 text-xs hover:bg-[#f5eadb]">
                    Rediger utkast
                  </button>
                )}
              </td>
              <td className="p-3">{statusLabel(product.status)}</td>
              <td className="p-3">{statusLabel(product.complianceStatus)}</td>
              <td className="p-3">
                {product.variants.length ? (
                  <ul className="space-y-2">
                    {product.variants.map((variant) => (
                      <li key={variant.sku}>
                        <span className="font-medium">{variant.label}</span>
                        {' · '}{money.format(variant.priceOre / 100)}
                        {!variant.isActive && <span className="ml-2 text-[#8a5c30]">(inaktiv)</span>}
                        <div className="text-xs text-[#6d6255]">{variant.sku}</div>
                      </li>
                    ))}
                  </ul>
                ) : <span className="text-[#6d6255]">Ingen varianter</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {saveMessage && <p role="status" className="mt-4 rounded border border-green-300 p-3 text-sm">{saveMessage}</p>}
      {saveError && <p role="alert" className="mt-4 rounded border border-red-300 p-3 text-sm text-red-900">{saveError}</p>}
      {draft && editingId !== null && (
        <form onSubmit={saveDraft} className="mt-6 space-y-4 rounded-xl border border-[#e8dfd4] bg-white p-5">
          <div>
            <h3 className="font-serif text-xl">Rediger produktutkast #{editingId}</h3>
            <p className="text-xs text-[#6d6255]">Kun eksisterende utkast. Lagring publiserer ikke produktet eller godkjenner dokumentasjon.</p>
          </div>
          {([
            ['name', 'Produktnavn', 160],
            ['subtitle', 'Undertittel', 255],
          ] as const).map(([key, label, maxLength]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">{label}</span>
              <input required={key === 'name'} maxLength={maxLength} value={draft[key]}
                onChange={(event) => setDraft((prev) => prev ? { ...prev, [key]: event.target.value } : null)}
                className="w-full rounded border border-[#b7a797] p-2" />
            </label>
          ))}
          {([
            ['description', 'Beskrivelse'],
            ['ingredients', 'Ingredienser'],
            ['usage', 'Bruksanvisning'],
          ] as const).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">{label}</span>
              <textarea required={key === 'description'} maxLength={5000} rows={3} value={draft[key]}
                onChange={(event) => setDraft((prev) => prev ? { ...prev, [key]: event.target.value } : null)}
                className="w-full rounded border border-[#b7a797] p-2" />
            </label>
          ))}
          <fieldset className="space-y-3 border-t border-[#e8dfd4] pt-4">
            <legend className="font-medium">Variantpriser</legend>
            {draft.variants.map((variant, i) => (
              <label key={variant.sku} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>{variant.sku}</span>
                <span className="flex items-center gap-2">
                  Pris i øre (NOK)
                  <input type="number" min="1" max="100000000" step="1" required
                    value={variant.priceOre}
                    onChange={(event) => {
                      const priceOre = Number(event.target.value)
                      setDraft((prev) => prev ? {
                        ...prev,
                        variants: prev.variants.map((entry, index) =>
                          index === i ? { ...entry, priceOre } : entry),
                      } : null)
                    }}
                    className="w-32 rounded border border-[#b7a797] p-2" />
                </span>
              </label>
            ))}
            <p className="text-xs text-[#6d6255]">159,00 kr = 15900 øre. SKU og antall varianter kan ikke endres her. Utkast uten varianter kan få tekst oppdatert.</p>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving}
              className="rounded bg-[#443528] px-5 py-2 text-sm text-white disabled:opacity-50">
              {saving ? 'Lagrer …' : 'Lagre utkast'}
            </button>
            <button type="button" disabled={saving} onClick={() => { setEditingId(null); setDraft(null); setSaveError('') }}
              className="rounded border border-[#b7a797] px-5 py-2 text-sm disabled:opacity-50">
              Avbryt
            </button>
          </div>
        </form>
      )}
      <p className="mt-4 text-xs text-[#6d6255]">Bare utkast kan redigeres. Opprettelse, publisering, lager og betaling er ikke aktivert.</p>
    </div>
  )
}
