import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { ContextualTour } from "@/components/onboarding/contextual-tour"

export default function ConfiguracionPage() {
  return (
    <>
      <ContextualTour
        flowKey="puesta-en-marcha"
        stepKey="empresa"
        selector="#seccion-empresa"
        titulo="Completa los datos de tu empresa"
        descripcion="RUC, razón social y logo para tus comprobantes."
      />
      <PageHeader title="Configuración" description="Preferencias de la cuenta y del negocio" />
      <div id="seccion-empresa" className="flex flex-1 flex-col">
        <EmptyState title="Ajustes" description="Personaliza tu negocio, impuestos y usuarios." />
      </div>
    </>
  )
}
