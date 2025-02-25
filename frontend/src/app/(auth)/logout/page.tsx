'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { apiClient } from '@/lib/api-client'

export default function LogoutPage() {
    const router = useRouter()
    const { logout: authLogout } = useAuth()

    useEffect(() => {
        const logout = async () => {
            try {
                await apiClient('/auth/logout', {
                    method: 'POST'
                })

                // Limpiar estado de autenticación
                authLogout()

                toast.success('Sesión cerrada correctamente')
                router.push('/login')
            } catch (error) {
                console.error('Error al cerrar sesión:', error)
                toast.error(error instanceof Error ? error.message : 'Error al cerrar sesión')

                // Aún así, limpiamos el estado de autenticación y redirigimos
                authLogout()
                router.push('/login')
            }
        }

        logout()
    }, [router, authLogout])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Cerrando sesión...</h1>
                <p className="text-gray-500">Por favor espere...</p>
            </div>
        </div>
    )
} 