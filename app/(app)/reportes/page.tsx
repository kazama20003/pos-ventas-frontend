import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"

export default function ReportesPage() {
  return (
    <>
      <PageHeader title="Reportes" description="Analítica y exportaciones" />
      <EmptyState title="Sin reportes" description="Genera reportes de ventas, stock y caja." />
    </>
  )
}
