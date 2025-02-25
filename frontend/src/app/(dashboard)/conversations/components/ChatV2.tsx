import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send, MapPin, Smile } from 'lucide-react';
import { sendMessage, sendMedia, sendLocation, reactToMessage } from '@/lib/whatsapp-client.v2';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/use-socket';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot' | 'admin';
    createdAt: string;
    metadata?: string;
    conversationId?: string;
}

interface ChatProps {
    conversationId: string;
    phoneNumber: string;
    messages: Message[];
    onMessageSent: () => void;
}

export function ChatV2({ conversationId, phoneNumber, messages: initialMessages, onMessageSent }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const socket = useSocket();

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages, conversationId]);

    useEffect(() => {
        if (socket) {
            const handleNewMessage = (message: Message) => {
                if (message.conversationId === conversationId) {
                    console.log('=== NUEVO MENSAJE RECIBIDO EN CHAT ===', {
                        messageId: message.id,
                        conversationId: message.conversationId
                    });

                    setMessages(prev => {
                        // Remover mensajes temporales y duplicados
                        const filtered = prev.filter(msg =>
                            !msg.id.startsWith('temp_') && msg.id !== message.id
                        );

                        return [...filtered, message].sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );
                    });

                    if (onMessageSent) {
                        onMessageSent();
                    }
                }
            };

            socket.on('new_message', handleNewMessage);

            return () => {
                socket.off('new_message', handleNewMessage);
            };
        }
    }, [socket, conversationId, onMessageSent]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            setIsLoading(true);
            const tempId = `temp_${Date.now()}`;

            // Agregar mensaje temporal
            const tempMsg: Message = {
                id: tempId,
                content: newMessage,
                sender: 'bot',
                createdAt: new Date().toISOString(),
                conversationId: conversationId
            };

            setMessages(prev => [...prev, tempMsg]);
            setNewMessage('');

            // Enviar el mensaje
            const response = await sendMessage(phoneNumber, newMessage);

            // Actualizar el mensaje temporal con la respuesta real
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === tempId ? {
                        ...response,
                        conversationId: conversationId,
                        createdAt: response.createdAt || new Date().toISOString()
                    } : msg
                )
            );

            if (onMessageSent) {
                onMessageSent();
            }

            toast.success('Mensaje enviado');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            toast.error('Error al enviar el mensaje');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const response = await sendMedia(phoneNumber, file);

            // Agregar el mensaje de archivo localmente
            const newMsg: Message = {
                id: response.id,
                content: `📎 ${file.name}`,
                sender: 'bot',
                createdAt: new Date().toISOString(),
                conversationId: conversationId,
                metadata: JSON.stringify({
                    type: file.type.split('/')[0],
                    filename: file.name,
                    mimetype: file.type,
                    size: file.size
                })
            };

            setMessages(prev => [...prev, newMsg]);

            // Notificar al componente padre sin forzar recarga
            if (onMessageSent) {
                onMessageSent();
            }

            toast.success('Archivo enviado');
        } catch (error) {
            console.error('Error al enviar archivo:', error);
            toast.error('Error al enviar el archivo');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleShareLocation = async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocalización no soportada en este navegador');
            return;
        }

        try {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        await sendLocation(
                            phoneNumber,
                            position.coords.latitude,
                            position.coords.longitude,
                            'Mi ubicación actual'
                        );
                        onMessageSent();
                        toast.success('Ubicación enviada');
                    } catch (error) {
                        console.error('Error al enviar ubicación:', error);
                        toast.error('Error al enviar la ubicación');
                    } finally {
                        setIsLoading(false);
                    }
                },
                (error) => {
                    console.error('Error al obtener ubicación:', error);
                    toast.error('Error al obtener la ubicación');
                    setIsLoading(false);
                }
            );
        } catch (error) {
            console.error('Error al compartir ubicación:', error);
            toast.error('Error al compartir la ubicación');
            setIsLoading(false);
        }
    };

    const handleReaction = async (messageId: string, reaction: string) => {
        try {
            await reactToMessage(messageId, reaction);
            toast.success('Reacción enviada');
        } catch (error) {
            console.error('Error al enviar reacción:', error);
            toast.error('Error al enviar la reacción');
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 px-4"
                type="hover"
            >
                <div className="py-4 space-y-3">
                    {messages.map((message) => (
                        <div
                            key={`${message.id}-${message.createdAt}`}
                            className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-2.5 ${message.sender === 'user'
                                        ? 'bg-accent'
                                        : 'bg-primary text-primary-foreground'
                                    }`}
                            >
                                {message.metadata ? (
                                    <MessageContent message={message} />
                                ) : (
                                    <p className="text-sm">{message.content}</p>
                                )}
                                <div className="mt-1 text-[10px] opacity-70">
                                    {new Date(message.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="flex-none p-3 border-t bg-background">
                <div className="flex items-center gap-2 max-w-[100vw-2rem] lg:max-w-full">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,video/*,audio/*,application/*"
                        title="Seleccionar archivo"
                    />
                    <div className="flex-none flex gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="h-9 w-9"
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleShareLocation}
                            disabled={isLoading}
                            className="h-9 w-9"
                        >
                            <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleReaction(messages[messages.length - 1]?.id, '👍')}
                            disabled={isLoading || messages.length === 0}
                            className="h-9 w-9"
                        >
                            <Smile className="h-4 w-4" />
                        </Button>
                    </div>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escribe un mensaje..."
                        disabled={isLoading}
                        className="h-9"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={isLoading}
                        size="icon"
                        className="h-9 w-9"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function MessageContent({ message }: { message: Message }) {
    if (!message.metadata) return <p className="text-sm">{message.content}</p>;

    const metadata = JSON.parse(message.metadata);

    switch (metadata.type) {
        case 'image':
            return (
                <div>
                    <img
                        src={`data:${metadata.mimetype};base64,${metadata.data}`}
                        alt={metadata.filename}
                        className="max-w-full rounded"
                    />
                    {metadata.caption && (
                        <p className="mt-2 text-sm">{metadata.caption}</p>
                    )}
                </div>
            );
        case 'video':
            return (
                <div>
                    <video
                        controls
                        className="max-w-full rounded"
                        src={`data:${metadata.mimetype};base64,${metadata.data}`}
                    />
                    {metadata.caption && (
                        <p className="mt-2 text-sm">{metadata.caption}</p>
                    )}
                </div>
            );
        case 'audio':
            return (
                <audio
                    controls
                    src={`data:${metadata.mimetype};base64,${metadata.data}`}
                />
            );
        case 'location':
            return (
                <div>
                    <div className="bg-accent rounded p-2">
                        <p className="text-sm font-medium">📍 Ubicación compartida</p>
                        {metadata.description && (
                            <p className="text-sm mt-1">{metadata.description}</p>
                        )}
                        <p className="text-xs mt-1">
                            {metadata.latitude}, {metadata.longitude}
                        </p>
                    </div>
                </div>
            );
        default:
            return <p className="text-sm">{message.content}</p>;
    }
} 