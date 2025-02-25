import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { NotificationService } from '@/lib/notification'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/use-auth'

interface Message {
    id: string
    content: string
    sender: 'user' | 'bot' | 'admin'
    timestamp: string
    status?: 'sending' | 'sent' | 'error'
}

interface ChatWindowProps {
    conversationId: string
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isJoinedToRoom, setIsJoinedToRoom] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { token } = useAuth()
    const socketRef = useRef<Socket | null>(null)
    const currentConversationRef = useRef<string>(conversationId)

    // Función para desplazarse al último mensaje
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    // Efecto para actualizar la referencia de la conversación actual
    useEffect(() => {
        currentConversationRef.current = conversationId;
        setIsJoinedToRoom(false); // Resetear estado de unión a sala al cambiar de conversación
    }, [conversationId]);

    // Efecto para cargar mensajes iniciales
    const fetchMessages = useCallback(async () => {
        if (!conversationId || !token) return;

        console.log('Obteniendo mensajes para conversación:', conversationId);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${conversationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Error al cargar mensajes');

            const data = await response.json();
            console.log('Mensajes obtenidos:', data.messages);

            // Ordenar mensajes por timestamp
            const sortedMessages = data.messages.sort((a: Message, b: Message) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            setMessages(sortedMessages);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error al cargar los mensajes:', error);
            toast.error('Error al cargar los mensajes');
        }
    }, [conversationId, token, scrollToBottom]);

    // Efecto para inicializar Socket.IO y manejar eventos
    useEffect(() => {
        if (!token || !conversationId) {
            console.log('No hay token o conversationId, no se inicia Socket.IO');
            return;
        }

        console.log('=== INICIANDO SOCKET.IO ===');
        console.log('Token presente:', !!token);
        console.log('ConversationId:', conversationId);

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
        console.log('URL de WebSocket:', wsUrl);

        // Inicializar Socket.io con la misma configuración que SystemStatus
        const socket = io(wsUrl + '/chat', {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 5000,
            transports: ['websocket'],
            path: '/socket.io/chat'
        });

        socketRef.current = socket;

        // Manejadores de eventos de Socket.IO
        const handleConnect = () => {
            console.log('=== SOCKET.IO CONECTADO ===');
            console.log('Socket ID:', socket.id);
            setIsConnected(true);

            // Intentar unirse a la sala al conectar
            if (conversationId) {
                console.log('Intentando unirse a la conversación:', conversationId);
                socket.emit('join_conversation', { conversationId });
            }
        };

        const handleDisconnect = () => {
            console.log('=== SOCKET.IO DESCONECTADO ===');
            console.log('Último Socket ID:', socket.id);
            setIsConnected(false);
            setIsJoinedToRoom(false);
        };

        const handleConnectError = (error: Error) => {
            console.error('=== ERROR DE CONEXIÓN SOCKET.IO ===');
            console.error('Error:', error);
            console.error('Socket ID:', socket.id);
            console.error('Estado de conexión:', socket.connected);
            setIsConnected(false);
            setIsJoinedToRoom(false);
            toast.error('Error de conexión');
        };

        const handleJoinedConversation = (data: any) => {
            console.log('=== UNIDO A CONVERSACIÓN ===');
            console.log('Datos recibidos:', data);
            console.log('Conversación actual:', currentConversationRef.current);
            console.log('Socket ID:', socket.id);

            if (data.conversationId === currentConversationRef.current) {
                console.log('Unido exitosamente a la sala');
                setIsJoinedToRoom(true);
                fetchMessages();
            } else {
                console.log('ID de conversación no coincide');
            }
        };

        const handleNewMessage = (data: any) => {
            console.log('=== NUEVO MENSAJE RECIBIDO ===');
            console.log('Datos del mensaje:', data);
            console.log('Conversación actual:', currentConversationRef.current);
            console.log('Socket ID:', socket.id);
            console.log('Estado de conexión:', socket.connected);
            console.log('Estado de sala:', isJoinedToRoom);

            if (data.conversation?.id === currentConversationRef.current) {
                console.log('Procesando mensaje para la conversación actual');

                setMessages(prev => {
                    console.log('Mensajes actuales:', prev.length);

                    // Filtrar mensajes temporales y duplicados
                    const filtered = prev.filter(msg => {
                        const isTempDuplicate = msg.id.startsWith('temp-') && msg.content === data.content;
                        const isDuplicate = msg.id === data.id;
                        if (isTempDuplicate) console.log('Eliminando mensaje temporal duplicado');
                        if (isDuplicate) console.log('Evitando mensaje duplicado');
                        return !isTempDuplicate && !isDuplicate;
                    });

                    // Agregar el nuevo mensaje
                    const newMessages = [...filtered, {
                        id: data.id,
                        content: data.content,
                        sender: data.sender,
                        timestamp: data.timestamp || new Date().toISOString(),
                        status: 'sent'
                    }];

                    // Ordenar por timestamp
                    const sortedMessages = newMessages.sort((a, b) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );

                    console.log('Total mensajes después de actualización:', sortedMessages.length);
                    return sortedMessages;
                });

                if (data.sender === 'user') {
                    NotificationService.notify(data.content);
                }

                setTimeout(scrollToBottom, 100);
            } else {
                console.log('Mensaje ignorado - no corresponde a la conversación actual');
            }
        };

        // Suscribirse a eventos
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('joined_conversation', handleJoinedConversation);
        socket.on('new_message', handleNewMessage);

        // Limpiar al desmontar
        return () => {
            console.log('=== LIMPIANDO SOCKET.IO ===');
            console.log('Socket ID:', socket.id);
            console.log('Estado de conexión:', socket.connected);
            console.log('Conversación:', conversationId);

            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('joined_conversation', handleJoinedConversation);
            socket.off('new_message', handleNewMessage);

            if (conversationId) {
                console.log('Abandonando sala:', conversationId);
                socket.emit('leave_conversation', { conversationId });
            }
            socket.disconnect();
        };
    }, [conversationId, token, fetchMessages, scrollToBottom]);

    // Efecto para desplazarse al último mensaje cuando cambian los mensajes
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Manejador de envío de mensajes
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !isConnected || !isJoinedToRoom) return;

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            content: newMessage.trim(),
            sender: 'admin',
            timestamp: new Date().toISOString(),
            status: 'sending'
        };

        console.log('Enviando mensaje:', tempMessage);
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        scrollToBottom();

        try {
            setIsLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${conversationId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ content: tempMessage.content }),
                }
            );

            if (!response.ok) {
                throw new Error('Error al enviar mensaje');
            }

            console.log('Mensaje enviado exitosamente');
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === tempMessage.id ? { ...msg, status: 'error' } : msg
            ));
            toast.error('Error al enviar el mensaje');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                        <div
                            className={`rounded-lg px-4 py-2 max-w-[70%] ${message.sender === 'user'
                                ? 'bg-muted'
                                : 'bg-primary text-white'
                                }`}
                        >
                            <p className="text-sm break-words">{message.content}</p>
                            <div className="text-xs opacity-70 flex items-center gap-2 mt-1">
                                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                                <span>
                                    {message.sender === 'user' ? '(Cliente)' :
                                        message.sender === 'bot' ? '(Bot)' : '(Tú)'}
                                </span>
                                {message.status === 'error' && (
                                    <span className="text-red-500">Error al enviar</span>
                                )}
                                {message.status === 'sending' && (
                                    <span className="text-yellow-500">Enviando...</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="border-t p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={
                            !isConnected ? 'Reconectando...' :
                                !isJoinedToRoom ? 'Conectando a la sala...' :
                                    'Escribe un mensaje...'
                        }
                        className="flex-1 rounded-md border p-2"
                        disabled={isLoading || !isConnected || !isJoinedToRoom}
                    />
                    <button
                        type="submit"
                        className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
                        disabled={isLoading || !isConnected || !isJoinedToRoom}
                    >
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    );
} 