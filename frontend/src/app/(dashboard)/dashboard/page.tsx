'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { SystemStatus } from '@/components/dashboard/system-status'
import { Card } from '@/components/ui/card'
import {
    Users,
    MessageSquare,
    Clock,
    BrainCircuit
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DashboardStats {
    activeUsers: number
    totalConversations: number
    averageResponseTime: string
    aiQueriesHandled: number
}

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false)
    const { user, token } = useAuth()
    const [stats, setStats] = useState<DashboardStats>({
        activeUsers: 0,
        totalConversations: 0,
        averageResponseTime: '0s',
        aiQueriesHandled: 0
    })

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true)
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!token) return;

        const fetchStats = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/system/dashboard/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Error del servidor: ${error}`);
                }

                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error al obtener estadísticas:', error);
                toast.error('Error al obtener estadísticas del dashboard');
            }
        };

        fetchStats();

        // Actualizar cada minuto
        const interval = setInterval(fetchStats, 60000);

        return () => clearInterval(interval);
    }, [token]);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
                </div>
            </div>
        )
    }

    const statCards = [
        {
            title: 'Usuarios Activos',
            value: stats.activeUsers,
            icon: Users,
            description: 'Usuarios conectados actualmente'
        },
        {
            title: 'Conversaciones',
            value: stats.totalConversations,
            icon: MessageSquare,
            description: 'Total de conversaciones'
        },
        {
            title: 'Tiempo de Respuesta',
            value: stats.averageResponseTime,
            icon: Clock,
            description: 'Tiempo promedio de respuesta'
        },
        {
            title: 'Consultas IA',
            value: stats.aiQueriesHandled,
            icon: BrainCircuit,
            description: 'Consultas procesadas por IA'
        }
    ]

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Bienvenido, {user?.name || 'Usuario'} 👋
                </p>
            </div>

            {/* Estado del Sistema */}
            <div className="grid gap-4 md:grid-cols-2">
                <SystemStatus />

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
                    <div className="space-y-4">
                        {/* Aquí puedes agregar un componente de actividad reciente */}
                        <p className="text-sm text-muted-foreground">
                            Próximamente: Lista de actividades recientes...
                        </p>
                    </div>
                </Card>
            </div>

            {/* Estadísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <Card key={card.title} className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full p-2 bg-primary/10">
                                <card.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </p>
                                <h3 className="text-2xl font-bold">
                                    {card.value}
                                </h3>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            {card.description}
                        </p>
                    </Card>
                ))}
            </div>
        </div>
    )
} 