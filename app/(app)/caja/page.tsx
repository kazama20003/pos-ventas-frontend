import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { Button } from "@/components/ui/button"

export default function CajaPage() {
  return (
    <>
      <PageHeader
        title="Caja"
        description="Apertura, cierre y arqueo"
        actions={<Button size="sm">Abrir caja</Button>}
      />
      <EmptyState title="Caja cerrada" description="Abre una caja para comenzar a operar." />
    </>
  )
}
