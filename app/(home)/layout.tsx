export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // La landing trae su propia navegación integrada (diseño Ramos), así que el
  // layout del grupo solo aporta el contenedor.
  return <main className="min-h-svh">{children}</main>
}
