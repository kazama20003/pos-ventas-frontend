import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"

export default function FacturacionPage() {
  return (
    <>
      <PageHeader title="Facturación electrónica" description="Comprobantes SUNAT y series" />
      <EmptyState title="Sin comprobantes" description="Aquí verás boletas, facturas y notas de crédito." />
    </>
  )
}
