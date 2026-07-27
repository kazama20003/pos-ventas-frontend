import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"

export default function ConfiguracionPage() {
  return (
    <>
      <PageHeader title="Configuración" description="Preferencias de la cuenta y del negocio" />
      <EmptyState title="Ajustes" description="Personaliza tu negocio, impuestos y usuarios." />
    </>
  )
}
