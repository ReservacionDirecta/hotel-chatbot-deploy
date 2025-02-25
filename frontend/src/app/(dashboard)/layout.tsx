'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { useAuth } from '@/hooks/use-auth'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [mounted, setMounted] = useState(false)
    const { isAuthenticated, checkAuth } = useAuth()
    const pathname = usePathname()
    const isConversationsPage = pathname === '/conversations'
    const isSettingsPage = pathname === '/settings'

    useEffect(() => {
        // Verificar autenticación al montar
        checkAuth()
        setMounted(true)
    }, [checkAuth])

    // No renderizar nada hasta que el componente esté montado
    if (!mounted) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
                </div>
            </div>
        )
    }

    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-muted/10">
                {/* Sidebar - Solo visible en escritorio */}
                <div className="hidden lg:block">
                    <Sidebar />
                </div>

                <div className="flex flex-1 flex-col overflow-hidden">
                    {!isConversationsPage && !isSettingsPage && (
                        <header className="border-b bg-background">
                            <div className="container flex h-16 items-center">
                                <h1 className="text-xl font-bold">Hotel Chatbot</h1>
                            </div>
                        </header>
                    )}

                    {/* Contenido principal */}
                    <main className={`flex-1 overflow-y-auto ${isConversationsPage || isSettingsPage
                        ? 'pb-16 lg:pb-0'
                        : ''
                        }`}>
                        <div className="container h-full py-6">
                            {children}
                        </div>
                    </main>

                    {/* Navbar móvil - Visible en todas las páginas en móvil */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
                        <MobileNav />
                    </div>
                </div>
            </div>
        </AuthGuard>
    )
}
