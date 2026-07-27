import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"

export default function MensajesPage() {
  return (
    <>
      <PageHeader title="Mensajes" description="Conversaciones del equipo" />
      <EmptyState title="Bandeja vacía" description="Aquí verás los mensajes de tu equipo." />
    </>
  )
}
