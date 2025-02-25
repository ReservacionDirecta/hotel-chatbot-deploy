import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { io, Socket } from 'socket.io-client'

interface SystemStatus {
    whatsappConnection: 'connected' | 'disconnected' | 'connecting'
    aiStatus: 'online' | 'offline' | 'error'
    aiModel: string
    lastUpdate: Date
}

export function SystemStatus() {
    const { token } = useAuth()
    const [status, setStatus] = useState<SystemStatus>({
        whatsappConnection: 'disconnected',
        aiStatus: 'offline',
        aiModel: '',
        lastUpdate: new Date()
    })

    useEffect(() => {
        let socket: Socket | null = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        const connectSocket = () => {
            if (!token) return;

            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

            socket = io(wsUrl + '/system', {
                auth: { token },
                reconnection: true,
                reconnectionAttempts: maxReconnectAttempts,
                reconnectionDelay: 5000,
                transports: ['websocket'],
                path: '/socket.io/system'
            });

            socket.on('connect', () => {
                console.log('Conexión Socket.IO establecida');
                reconnectAttempts = 0;
            });

            socket.on('status_update', (data: { status: SystemStatus }) => {
                try {
                    setStatus({
                        ...data.status,
                        lastUpdate: new Date()
                    });
                } catch (error) {
                    console.error('Error al procesar mensaje Socket.IO:', error);
                }
            });

            socket.on('disconnect', () => {
                console.log('Socket.IO desconectado');
                setStatus(prev => ({
                    ...prev,
                    whatsappConnection: 'disconnected',
                    lastUpdate: new Date()
                }));
            });

            socket.on('connect_error', (error: Error) => {
                console.error('Error de conexión Socket.IO:', error);
                reconnectAttempts++;
                console.log(`Intento de reconexión ${reconnectAttempts} de ${maxReconnectAttempts}`);
            });
        };

        connectSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [token]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected':
            case 'online':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'disconnected':
            case 'offline':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected':
            case 'online':
                return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
            case 'disconnected':
            case 'offline':
                return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            default:
                return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
        }
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">WhatsApp</span>
                    <Badge variant="outline" className={getStatusColor(status.whatsappConnection)}>
                        <span className="flex items-center gap-2">
                            {getStatusIcon(status.whatsappConnection)}
                            {status.whatsappConnection === 'connected' ? 'Conectado' :
                                status.whatsappConnection === 'disconnected' ? 'Desconectado' :
                                    'Conectando...'}
                        </span>
                    </Badge>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">IA</span>
                    <Badge variant="outline" className={getStatusColor(status.aiStatus)}>
                        <span className="flex items-center gap-2">
                            {getStatusIcon(status.aiStatus)}
                            {status.aiStatus === 'online' ? 'En línea' :
                                status.aiStatus === 'offline' ? 'Fuera de línea' :
                                    'Error'}
                        </span>
                    </Badge>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Modelo IA</span>
                    <Badge variant="outline">
                        {status.aiModel}
                    </Badge>
                </div>

                <div className="text-xs text-muted-foreground text-right mt-4">
                    Última actualización: {status.lastUpdate.toLocaleTimeString()}
                </div>
            </div>
        </Card>
    );
} 