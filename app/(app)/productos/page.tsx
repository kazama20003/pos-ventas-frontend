import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { Button } from "@/components/ui/button"

export default function ProductosPage() {
  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo, variantes y precios"
        actions={<Button size="sm">Nuevo producto</Button>}
      />
      <EmptyState title="Catálogo vacío" description="Agrega tu primer producto para empezar a vender." />
    </>
  )
}
