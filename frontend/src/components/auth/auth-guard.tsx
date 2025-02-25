'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { isAuthenticated, checkAuth } = useAuth()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const verifyAuth = () => {
            const isValid = checkAuth()
            setLoading(false)

            if (!isValid) {
                router.push('/login')
            }
        }

        verifyAuth()
    }, [checkAuth, router])

    // Mientras verifica la autenticación
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="mt-4 text-sm text-muted-foreground">Verificando autenticación...</p>
                </div>
            </div>
        )
    }

    // Si no está autenticado, no renderizar nada (la redirección ya está en proceso)
    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="mt-4 text-sm text-muted-foreground">Redirigiendo al login...</p>
                </div>
            </div>
        )
    }

    // Si está autenticado, mostrar el contenido
    return <>{children}</>
}
