import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { Button } from "@/components/ui/button"

export default function VentasPage() {
  return (
    <>
      <PageHeader
        title="Ventas"
        description="Comprobantes y transacciones"
        actions={<Button size="sm">Nueva venta</Button>}
      />
      <EmptyState title="Sin ventas registradas" description="Las ventas del día aparecerán aquí." />
    </>
  )
}
