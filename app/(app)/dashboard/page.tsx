import {
  RiShoppingCart2Line,
  RiMoneyDollarCircleLine,
  RiUser3Line,
  RiArchiveLine,
  RiArrowUpLine,
  RiArrowDownLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { FirstSaleChecklist } from "@/components/onboarding/first-sale-checklist"
import { AlertaVencimientos } from "@/components/inventario/alerta-vencimientos"

const stats = [
  {
    label: "Ventas de hoy",
    value: "S/ 12,480",
    delta: "+12.5%",
    up: true,
    icon: RiMoneyDollarCircleLine,
  },
  {
    label: "Transacciones",
    value: "324",
    delta: "+4.1%",
    up: true,
    icon: RiShoppingCart2Line,
  },
  {
    label: "Clientes nuevos",
    value: "48",
    delta: "-2.0%",
    up: false,
    icon: RiUser3Line,
  },
  {
    label: "Productos bajo stock",
    value: "17",
    delta: "+3",
    up: false,
    icon: RiArchiveLine,
  },
]

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen de la operación de hoy"
        actions={<Button size="sm">Nueva venta</Button>}
      />
       <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 md:p-6">
         <FirstSaleChecklist />
         <AlertaVencimientos />
         <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{s.label}</CardDescription>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="size-5" />
                  </div>
                </div>
                <CardTitle className="text-2xl">{s.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    s.up
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {s.up ? (
                    <RiArrowUpLine className="size-3" />
                  ) : (
                    <RiArrowDownLine className="size-3" />
                  )}
                  {s.delta}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  vs. ayer
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ventas de la semana</CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-56 items-end gap-3">
                {[45, 62, 38, 74, 55, 88, 70].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {["L", "M", "M", "J", "V", "S", "D"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top productos</CardTitle>
              <CardDescription>Más vendidos hoy</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[
                { name: "Café molido 500g", qty: 84 },
                { name: "Pan integral", qty: 61 },
                { name: "Leche entera 1L", qty: 52 },
                { name: "Huevos x12", qty: 40 },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="truncate text-sm">{p.name}</span>
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    {p.qty}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
