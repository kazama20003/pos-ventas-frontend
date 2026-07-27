import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { Button } from "@/components/ui/button"

export default function ClientesPage() {
  return (
    <>
      <PageHeader
        title="Clientes"
        description="Directorio y cuentas de crédito"
        actions={<Button size="sm">Nuevo cliente</Button>}
      />
      <EmptyState title="Sin clientes" description="Registra tus clientes para agilizar la venta." />
    </>
  )
}
