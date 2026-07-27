import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"

export default function InventarioPage() {
  return (
    <>
      <PageHeader title="Inventario" description="Stock, lotes y transferencias" />
      <EmptyState title="Sin movimientos" description="El kardex de inventario aparecerá aquí." />
    </>
  )
}
