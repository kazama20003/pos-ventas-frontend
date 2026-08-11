import { Toaster } from "sonner"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { OnboardingGuide } from "@/components/onboarding/onboarding-guide"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-svh gap-4 bg-muted p-4"
      style={{ fontFamily: "var(--font-sora), sans-serif" }}
    >
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-[0_12px_40px_rgba(20,15,35,0.10)]">
        {children}
      </main>
      <Toaster richColors closeButton position="top-right" />
      <OnboardingGuide />
    </div>
  )
}
