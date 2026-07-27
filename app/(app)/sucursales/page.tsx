import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { Button } from "@/components/ui/button"

export default function SucursalesPage() {
  return (
    <>
      <PageHeader
        title="Sucursales"
        description="Locales, almacenes y terminales"
        actions={<Button size="sm">Nueva sucursal</Button>}
      />
      <EmptyState title="Sin sucursales" description="Agrega tu primera sucursal para operar." />
    </>
  )
}
