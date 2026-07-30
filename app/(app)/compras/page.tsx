import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { Button } from "@/components/ui/button"

export default function ComprasPage() {
  return (
    <>
      <PageHeader title="Compras" description="Órdenes, recepciones y pagos" actions={<Button size="sm">Nueva orden</Button>} />
      <EmptyState title="Sin órdenes de compra" description="Crea una orden para reabastecer inventario." />
    </>
  )
}
