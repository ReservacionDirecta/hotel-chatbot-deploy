'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, ScrollText, Settings, Bed, LogOut, Brain, Users } from 'lucide-react'
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

export function Sidebar() {
    const pathname = usePathname()
    const { user } = useAuth()

    console.log('Usuario actual:', user)

    const filteredItems = items.filter(item => !item.role || item.role === user?.role)

    return (
        <div className="flex h-full w-[200px] flex-col border-r bg-background">
            <div className="flex h-14 items-center border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    Hotel Assistant
                </Link>
            </div>
            <nav className="flex-1 space-y-1 p-2">
                {filteredItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                isActive
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    )
                })}
            </nav>
            <div className="border-t p-2">
                <Link
                    href="/logout"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                </Link>
            </div>
        </div>
    )
} 