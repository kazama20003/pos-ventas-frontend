import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"

export default function NotificacionesPage() {
  return (
    <>
      <PageHeader title="Notificaciones" description="Alertas del sistema" />
      <EmptyState title="Todo al día" description="No tienes notificaciones pendientes." />
    </>
  )
}
