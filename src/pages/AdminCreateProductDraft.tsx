import { useState, type FormEvent } from 'react'
import {
  createProductDraft,
  type NisrinCreateProductInput,
} from '@/services/nisrinAdminApi'

function blankDraft(): NisrinCreateProductInput {
  return {
    name: '',
    subtitle: '',
    description: '',
    ingredients: '',
    usage: '',
    variants: [{ sku: '', label: '', priceOre: 0 }],
  }
}

/** Creation is intentionally draft-only. This form cannot approve or publish. */
export default function AdminCreateProductDraft({ onCreated }: { onCreated: () => Promise<void> }) {
  const [form, setForm] = useState<NisrinCreateProductInput>(blankDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const updateVariant = (index: number, changes: Partial<NisrinCreateProductInput['variants'][number]>) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) => i === index ? { ...variant, ...changes } : variant),
    }))
  }

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const skus = form.variants.map((v) => v.sku)
    if (!form.name.trim() || !form.description.trim() ||
        form.variants.length < 1 || form.variants.length > 20 ||
        new Set(skus).size !== skus.length ||
        form.variants.some((v) =>
          !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(v.sku) ||
          !v.label.trim() ||
          !Number.isSafeInteger(v.priceOre) || v.priceOre < 1 || v.priceOre > 100000000)) {
      setError('Sjekk navn og beskrivelse, unike SKU-er (A–Z, 0–9, punktum, bindestrek), variantnavn og positive heltallspriser i øre.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      const id = await createProductDraft(form)
      setMessage(`Serveren bekreftet produktutkast #${id}. Produktet er IKKE publisert eller godkjent.`)
      setForm(blankDraft())
      try {
        await onCreated()
      } catch {
        setError('Utkastet ble opprettet, men listen kunne ikke oppdateres. Last siden på nytt.')
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Serveren bekreftet ikke opprettelsen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <details className="mb-6 rounded-xl border border-[#e8dfd4] bg-white p-5">
      <summary className="cursor-pointer font-semibold">Opprett nytt produktutkast</summary>
      <p className="mt-2 text-xs text-[#6d6255]">
        Utkastet lagres på NISRIN-serveren med inaktive varianter. Ingen bilder, lager,
        godkjenning, publisering eller betaling aktiveres her.
      </p>
      <form onSubmit={create} className="mt-5 space-y-4">
        {([
          ['name', 'Produktnavn', 160],
          ['subtitle', 'Undertittel', 255],
        ] as const).map(([key, label, maxLength]) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block font-medium">{label}</span>
            <input required={key === 'name'} maxLength={maxLength} value={form[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
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
            <textarea required={key === 'description'} maxLength={5000} rows={3} value={form[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              className="w-full rounded border border-[#b7a797] p-2" />
          </label>
        ))}
        <fieldset className="space-y-3 border-t border-[#e8dfd4] pt-4">
          <legend className="font-medium">Varianter og priser</legend>
          {form.variants.map((variant, index) => (
            <div key={index} className="grid gap-3 rounded border border-[#e8dfd4] p-3 md:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block">SKU (unik)</span>
                <input required maxLength={80} pattern="[A-Z0-9][A-Z0-9._-]*"
                  value={variant.sku}
                  onChange={(event) => updateVariant(index, { sku: event.target.value.toUpperCase() })}
                  className="w-full rounded border border-[#b7a797] p-2" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">Størrelse / variantnavn</span>
                <input required maxLength={120} value={variant.label}
                  onChange={(event) => updateVariant(index, { label: event.target.value })}
                  className="w-full rounded border border-[#b7a797] p-2" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">Pris i øre (NOK)</span>
                <input type="number" required min="1" max="100000000" step="1"
                  value={variant.priceOre || ''}
                  onChange={(event) => updateVariant(index, { priceOre: Number(event.target.value) })}
                  className="w-full rounded border border-[#b7a797] p-2" />
              </label>
              {form.variants.length > 1 && (
                <button type="button" disabled={saving}
                  onClick={() => setForm((prev) => ({
                    ...prev, variants: prev.variants.filter((_, i) => i !== index),
                  }))}
                  className="justify-self-start text-xs text-red-700 underline disabled:opacity-50">
                  Fjern variant
                </button>
              )}
            </div>
          ))}
          <button type="button" disabled={saving || form.variants.length >= 20}
            onClick={() => setForm((prev) => ({
              ...prev, variants: [...prev.variants, { sku: '', label: '', priceOre: 0 }],
            }))}
            className="rounded border border-[#786454] px-3 py-2 text-xs disabled:opacity-50">
            Legg til variant
          </button>
          <p className="text-xs text-[#6d6255]">
            159,00 kr = 15900 øre. SKU er unik i hele NISRIN-katalogen.
            Produktet forblir et upublisert utkast til egen godkjenning.
          </p>
        </fieldset>
        <button type="submit" disabled={saving}
          className="rounded bg-[#443528] px-5 py-2 text-sm text-white disabled:opacity-50">
          {saving ? 'Oppretter på serveren …' : 'Lagre nytt utkast'}
        </button>
      </form>
      {error && <p role="alert" className="mt-4 rounded border border-red-300 p-3 text-sm text-red-900">{error}</p>}
      {message && <p role="status" className="mt-4 rounded border border-green-300 p-3 text-sm">{message}</p>}
    </details>
  )
}
