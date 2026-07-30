import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { Button } from "@/components/ui/button"

export default function ProveedoresPage() {
  return (
    <>
      <PageHeader title="Proveedores" description="Directorio y cuentas por pagar" actions={<Button size="sm">Nuevo proveedor</Button>} />
      <EmptyState title="Sin proveedores" description="Registra tus proveedores para gestionar compras." />
    </>
  )
}
