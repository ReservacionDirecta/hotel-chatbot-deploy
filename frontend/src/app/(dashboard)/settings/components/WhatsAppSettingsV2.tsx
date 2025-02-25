import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { getQR, getStatus, logout } from '@/lib/whatsapp-client.v2';
import { toast } from 'sonner';

export function WhatsAppSettingsV2() {
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 3000); // Reducido a 3 segundos para actualizaciones más frecuentes
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            setError(null);
            const statusResponse = await getStatus();
            console.log('Estado de WhatsApp:', statusResponse);

            setStatus(statusResponse.status);
            setIsInitialized(statusResponse.isInitialized);
            setIsLoading(false);

            // Si no está conectado, intentar obtener el QR
            if (statusResponse.status !== 'connected') {
                    const qrResponse = await getQR();
                console.log('Respuesta QR:', qrResponse);

                    if (qrResponse.qr) {
                        setQrCode(qrResponse.qr);
                    setError(null);
                    } else {
                        setQrCode(null);
                        if (!qrResponse.isInitialized) {
                            setError('Inicializando WhatsApp... Por favor espera.');
                    }
                }
            } else {
                setQrCode(null);
            }
        } catch (error) {
            console.error('Error en checkStatus:', error);
            setError(error instanceof Error ? error.message : 'Error al verificar el estado');
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await logout();
            setStatus('disconnected');
            setQrCode(null);
            setIsInitialized(false);
            toast.success('Sesión cerrada correctamente');
            await checkStatus();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            toast.error('Error al cerrar sesión');
            setError(error instanceof Error ? error.message : 'Error al cerrar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'connected':
                return 'bg-green-500';
            case 'connecting':
                return 'bg-yellow-500 animate-pulse';
            default:
                return 'bg-red-500';
        }
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">WhatsApp (v2)</h2>
                            <p className="text-sm text-muted-foreground">
                                Conecta tu WhatsApp para enviar y recibir mensajes
                            </p>
                        </div>
                        {status === 'connected' && (
                            <Button
                                variant="destructive"
                                onClick={handleLogout}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Desconectando...' : 'Desconectar'}
                            </Button>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
                        <span className="text-sm font-medium">
                            {status === 'connected'
                                ? 'Conectado'
                                : status === 'connecting'
                                    ? 'Conectando...'
                                    : 'Desconectado'}
                        </span>
                    </div>

                    {status !== 'connected' && qrCode && (
                        <div className="flex flex-col items-center space-y-4">
                            <h3 className="text-lg font-medium">Escanea el código QR</h3>
                            <div className="p-4 bg-white rounded-lg shadow-md">
                            <QRCodeSVG value={qrCode} size={256} level="H" />
                            </div>
                            <div className="space-y-2 text-center">
                                <p className="text-sm text-muted-foreground">
                                    1. Abre WhatsApp en tu teléfono
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    2. Toca Menú (⋮) o Configuración y selecciona WhatsApp Web
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    3. Toca en + o 'Vincular dispositivo'
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    4. Apunta tu teléfono hacia esta pantalla para escanear el código
                                </p>
                            </div>
                        </div>
                    )}

                    {status !== 'connected' && !qrCode && !isLoading && !error && (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                                {isInitialized
                                    ? 'Esperando código QR...'
                                    : 'Inicializando WhatsApp... Por favor espera.'}
                            </p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex justify-center py-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 