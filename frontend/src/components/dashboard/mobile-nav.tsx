'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, MessageSquare, ScrollText, Settings, Bed, Brain, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const items = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home
    },
    {
        title: 'Conversaciones',
        href: '/conversations',
        icon: MessageSquare
    },
    {
        title: 'Habitaciones',
        href: '/rooms',
        icon: Bed
    },
    {
        title: 'Entrenamiento',
        href: '/training',
        icon: Brain
    },
    {
        title: 'Scripts',
        href: '/scripts',
        icon: ScrollText
    },
    {
        title: 'Usuarios',
        href: '/admin/users',
        icon: Users,
        role: 'admin'
    },
    {
        title: 'Ajustes',
        href: '/settings',
        icon: Settings
    }
]

export function MobileNav() {
    const router = useRouter()
    const pathname = usePathname()
    const { user } = useAuth()

    const filteredItems = items.filter(item => !item.role || item.role === user?.role)

    return (
        <nav className="border-t bg-background">
            <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
                {filteredItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={cn(
                                'flex flex-col items-center gap-1 text-xs',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-primary'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.title}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
} 