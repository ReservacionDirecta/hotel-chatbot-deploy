import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface Conversation {
    id: string
    contact: string
    lastMessage: string
    timestamp: string
    unread: boolean
}

interface ConversationListProps {
    onSelectConversation: (conversation: Conversation) => void
    selectedId?: string
    onRefresh?: () => Promise<void>
}

export function ConversationList({ onSelectConversation, selectedId, onRefresh }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(false)
    const { token, isAuthenticated } = useAuth()

    const fetchConversations = useCallback(async () => {
        if (!isAuthenticated || !token) {
            console.log('No autenticado o sin token')
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/chat/conversations', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`)
            }

            const data = await response.json()
            setConversations(data)
        } catch (error) {
            console.error('Error:', error)
            toast.error(error instanceof Error ? error.message : 'Error al cargar las conversaciones')
        } finally {
            setLoading(false)
        }
    }, [token, isAuthenticated])

    useEffect(() => {
        fetchConversations()

        // Actualizar cada 30 segundos
        const interval = setInterval(fetchConversations, 30000)

        return () => clearInterval(interval)
    }, [fetchConversations])

    if (loading && conversations.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!loading && conversations.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No hay conversaciones</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {conversations.map((conversation) => (
                <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`w-full p-4 text-left transition-colors rounded-lg hover:bg-muted ${selectedId === conversation.id ? 'bg-muted' : ''
                        }`}
                >
                    <div className="flex justify-between gap-2">
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{conversation.contact}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{conversation.lastMessage}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(conversation.timestamp).toLocaleString()}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    )
} 