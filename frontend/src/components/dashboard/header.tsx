'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, User, Loader2 } from 'lucide-react'

export function Header() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { user, logout } = useAuth()

    const handleLogout = () => {
        setIsLoading(true)
        // Simulamos un delay
        setTimeout(() => {
            logout()
            router.push('/login')
        }, 500)
    }

    return (
        <header className="sticky top-0 z-50 border-b bg-background">
            <div className="container flex h-16 items-center justify-between px-4">
                <Link href="/dashboard" className="text-xl font-bold">
                    Hotel Chatbot
                </Link>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={handleLogout}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="h-4 w-4" />
                        )}
                        <span className="sr-only">Cerrar sesión</span>
                    </Button>
                </div>
            </div>
        </header>
    )
} 