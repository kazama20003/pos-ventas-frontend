import { RiToolsLine } from "@remixicon/react"

export function EmptyState({
  title = "En construcción",
  description = "Este módulo aún no tiene datos. Pronto estará disponible.",
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <RiToolsLine className="size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
