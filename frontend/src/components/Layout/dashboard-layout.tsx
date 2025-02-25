import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/10">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="container h-full py-6">
          {children}
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
