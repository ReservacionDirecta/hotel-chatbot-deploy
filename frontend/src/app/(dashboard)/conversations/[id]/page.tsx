import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { notificationService } from '@/lib/notification';
import { useSettings } from '@/hooks/use-settings';

interface Message {
    id: string;
    content: string;
    sender: string;
    timestamp: string;
}

export default function ConversationPage() {
    const { id } = useParams();
    const { user, token } = useAuth();
    const { settings } = useSettings();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !token) return;
        loadMessages();
        setupWebSocket();
    }, [user, token, id]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Error cargando mensajes');
            const data = await response.json();
            setMessages(data.messages);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupWebSocket = () => {
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/chat`);

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'new_message' && data.conversationId === id) {
                // Actualizar mensajes
                setMessages(prev => [...prev, data.message]);

                // Verificar configuración de notificaciones
                if (settings?.notifyOnMessage && data.message.sender !== user?.id) {
                    // Mostrar notificación y reproducir sonido
                    await notificationService.showNotification('Nuevo mensaje', {
                        body: data.message.content,
                        tag: 'new-message',
                        renotify: true
                    });
                }
            }
        };

        return () => {
            ws.close();
        };
    };

    if (loading) {
        return <div>Cargando mensajes...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === user?.id ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                        <div
                            className={`rounded-lg px-4 py-2 max-w-[70%] ${message.sender === user?.id
                                ? 'bg-primary text-white'
                                : 'bg-muted'
                                }`}
                        >
                            <p className="text-sm">{message.content}</p>
                            <span className="text-xs opacity-70">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 