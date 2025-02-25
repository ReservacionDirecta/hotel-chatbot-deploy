'use client'

import { useState, useEffect } from 'react'
import { ConversationListV2 } from './components/ConversationListV2'
import { ChatV2 } from './components/ChatV2'
import { useSocket } from '@/hooks/use-socket'
import { getConversations } from '@/lib/whatsapp-client.v2'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Message {
    id: string
    content: string
    sender: 'user' | 'bot' | 'admin'
    createdAt: string
    metadata?: string
    conversationId?: string
}

interface Conversation {
    id: string
    whatsappId: string
    phoneNumber: string
    name: string
    lastMessage: string
    lastMessageAt: string
    status: string
    messages: Message[]
}

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const socket = useSocket()

    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        if (socket) {
            console.log('Socket disponible, configurando eventos...');

            // Unirse a la sala de la conversación seleccionada
            if (selectedConversation) {
                console.log('Uniéndose a la sala:', selectedConversation.id);
                socket.emit('join_conversation', { conversationId: selectedConversation.id });
            }

            // Escuchar nuevos mensajes
            const handleNewMessage = (message: Message) => {
                console.log('=== NUEVO MENSAJE RECIBIDO EN LISTA ===', {
                    messageId: message.id,
                    conversationId: message.conversationId
                });

                setConversations(prevConversations => {
                    return prevConversations.map(conv => {
                        if (conv.id === message.conversationId) {
                            // Filtrar mensajes duplicados
                            const filteredMessages = conv.messages.filter(msg => msg.id !== message.id);
                            return {
                                ...conv,
                                lastMessage: message.content,
                                lastMessageAt: message.createdAt,
                                messages: [...filteredMessages, message].sort((a, b) =>
                                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                                )
                            };
                        }
                        return conv;
                    }).sort((a, b) =>
                        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                    );
                });

                if (selectedConversation?.id === message.conversationId) {
                    setSelectedConversation(prev => {
                        if (!prev) return null;
                        // Filtrar mensajes duplicados
                        const filteredMessages = prev.messages.filter(msg => msg.id !== message.id);
                        return {
                            ...prev,
                            lastMessage: message.content,
                            lastMessageAt: message.createdAt,
                            messages: [...filteredMessages, message].sort((a, b) =>
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            )
                        };
                    });
                }
            };

            const handleConversationUpdate = (updatedConversation: Conversation) => {
                console.log('=== ACTUALIZACIÓN DE CONVERSACIÓN RECIBIDA ===', {
                    conversationId: updatedConversation.id
                });

                setConversations(prevConversations => {
                    const index = prevConversations.findIndex(conv => conv.id === updatedConversation.id);
                    if (index === -1) {
                        return [updatedConversation, ...prevConversations];
                    }
                    const newConversations = [...prevConversations];
                    newConversations[index] = {
                        ...newConversations[index],
                        ...updatedConversation,
                        messages: newConversations[index].messages
                    };
                    return newConversations.sort((a, b) =>
                        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                    );
                });

                if (selectedConversation?.id === updatedConversation.id) {
                    setSelectedConversation(prev => ({
                        ...prev!,
                        ...updatedConversation,
                        messages: prev?.messages || []
                    }));
                }
            };

            // Solo escuchar los eventos unificados
            socket.on('new_message', handleNewMessage);
            socket.on('conversation_updated', handleConversationUpdate);

            return () => {
                console.log('Limpiando eventos de socket...');
                if (selectedConversation) {
                    socket.emit('leave_conversation', { conversationId: selectedConversation.id });
                }
                socket.off('new_message', handleNewMessage);
                socket.off('conversation_updated', handleConversationUpdate);
            };
        }
    }, [socket, selectedConversation]);

    const loadConversations = async () => {
        try {
            setIsLoading(true)
            const response = await getConversations()
            setConversations(response)

            // Actualizar la conversación seleccionada si existe
            if (selectedConversation) {
                const updatedSelected = response.find(conv => conv.id === selectedConversation.id)
                if (updatedSelected) {
                    setSelectedConversation(updatedSelected)
                }
            }
        } catch (error) {
            console.error('Error al cargar conversaciones:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation)
    }

    const handleMessageSent = () => {
        // Ya no necesitamos recargar todas las conversaciones
        // Las actualizaciones se manejan a través de los eventos del socket
    }

    const handleBackToList = () => {
        setSelectedConversation(null);
    };

    if (isLoading) {
        return (
            <div className="container py-6 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-1rem)] flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                <div className={`col-span-12 lg:col-span-4 overflow-hidden flex flex-col ${selectedConversation ? 'hidden lg:flex' : 'flex'
                    }`}>
                    <ConversationListV2
                        conversations={conversations}
                        onSelectConversation={handleSelectConversation}
                        selectedId={selectedConversation?.id}
                    />
                </div>
                <div className={`col-span-12 lg:col-span-8 overflow-hidden flex flex-col ${selectedConversation ? 'flex' : 'hidden lg:flex'
                    }`}>
                    {selectedConversation ? (
                        <div className="flex flex-col h-full">
                            <div className="flex-none p-3 border-b lg:hidden">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handleBackToList}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {selectedConversation.name || selectedConversation.phoneNumber}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {selectedConversation.phoneNumber}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <ChatV2
                                    conversationId={selectedConversation.id}
                                    phoneNumber={selectedConversation.phoneNumber}
                                    messages={selectedConversation.messages}
                                    onMessageSent={handleMessageSent}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Selecciona una conversación
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 