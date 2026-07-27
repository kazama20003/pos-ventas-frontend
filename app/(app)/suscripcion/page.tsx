import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"

export default function SuscripcionPage() {
  return (
    <>
      <PageHeader title="Suscripción" description="Plan, facturación y uso" />
      <EmptyState title="Plan activo" description="Consulta tu plan y consumo aquí." />
    </>
  )
}
