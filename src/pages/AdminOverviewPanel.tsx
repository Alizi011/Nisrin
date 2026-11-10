import { useEffect, useState } from 'react'
import { getAdminOverview, type NisrinAdminOverview } from '@/services/nisrinAdminApi'

const metrics: { key: keyof NisrinAdminOverview; label: string; description: string }[] = [
  { key: 'productsTotal', label: 'Produkter', description: 'Alle registrerte produkter' },
  { key: 'productsDraft', label: 'Utkast', description: 'Ennå ikke publisert' },
  { key: 'productsPendingApproval', label: 'Venter på godkjenning', description: 'Dokumentasjon må kontrolleres' },
  { key: 'ordersTotal', label: 'Ordre', description: 'Registrert i NISRIN-databasen' },
]

export default function AdminOverviewPanel() {
  const [data, setData] = useState<NisrinAdminOverview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getAdminOverview()
      .then((result) => { if (active) setData(result) })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Kunne ikke hente butikkoversikten.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) {
    return <p role="status" className="text-sm text-[#6d6255]">Henter butikkoversikt fra NISRIN …</p>
  }

  if (error) {
    return <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</p>
  }

  if (!data) {
    return <p role="alert" className="text-sm text-[#6d6255]">Ingen oversiktsdata tilgjengelig.</p>
  }

  return (
    <>
      <p className="mb-4 text-sm text-[#6d6255]">Oppdaterte tall fra NISRINs database</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map(({ key, label, description }) => (
          <div key={key} className="rounded-lg border border-[#e8dfd4] bg-[#fbfaf7] p-4">
            <div className="text-sm">{label}</div>
            <div className="mt-2 font-serif text-3xl">{data[key].toLocaleString('nb-NO')}</div>
            <div className="mt-2 text-xs text-[#6d6255]">{description}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#6d6255]">
        Omsetning og betalte ordre vises først når ekte betalings- og ordrebekreftelse er integrert.
      </p>
    </>
  )
}
