import { useEffect, useState } from 'react'
import { getAdminProducts, type NisrinAdminProduct } from '@/services/nisrinAdminApi'

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
      <p className="mt-4 text-xs text-[#6d6255]">Lesemodus. Redigering og publisering er ikke aktivert.</p>
    </div>
  )
}
