import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/layout/empty-state"
import { Button } from "@/components/ui/button"

export default function EmpresasPage() {
  return (
    <>
      <PageHeader
        title="Empresas"
        description="Organizaciones y razones sociales"
        actions={<Button size="sm">Nueva empresa</Button>}
      />
      <EmptyState title="Sin empresas" description="Registra la empresa que administrarás." />
    </>
  )
}
