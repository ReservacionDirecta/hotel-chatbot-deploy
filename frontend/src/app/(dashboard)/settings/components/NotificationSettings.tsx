import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface NotificationSettingsData {
    emailEnabled: boolean;
    phoneEnabled: boolean;
    pushEnabled: boolean;
    notifyOnBooking: boolean;
    notifyOnCheckIn: boolean;
    notifyOnCheckOut: boolean;
    notifyOnMessage: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function NotificationSettings() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<NotificationSettingsData>({
        emailEnabled: false,
        phoneEnabled: false,
        pushEnabled: false,
        notifyOnBooking: false,
        notifyOnCheckIn: false,
        notifyOnCheckOut: false,
        notifyOnMessage: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !token) {
            router.push('/login');
            return;
        }
        loadSettings();
    }, [user, token, router]);

    const loadSettings = async () => {
        try {
            if (!token) {
                throw new Error('No se encontró el token de autenticación');
            }

            console.log('Cargando configuración desde:', `${API_URL}/settings/notifications`);

            const response = await fetch(`${API_URL}/settings/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Error de respuesta:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Detalles del error:', errorText);
                throw new Error(`Error al cargar configuración: ${response.status}`);
            }

            const data = await response.json() as NotificationSettingsData;
            console.log('Configuración cargada:', data);

            setSettings({
                emailEnabled: data.emailEnabled ?? false,
                phoneEnabled: data.phoneEnabled ?? false,
                pushEnabled: data.pushEnabled ?? false,
                notifyOnBooking: data.notifyOnBooking ?? false,
                notifyOnCheckIn: data.notifyOnCheckIn ?? false,
                notifyOnCheckOut: data.notifyOnCheckOut ?? false,
                notifyOnMessage: data.notifyOnMessage ?? false,
            });
        } catch (error: unknown) {
            console.error('Error cargando configuración:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al cargar la configuración: ' + errorMessage);
            if (error instanceof Error && error.message.includes('token')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key: keyof NotificationSettingsData, value: boolean) => {
        try {
            if (!token) {
                throw new Error('No se encontró el token de autenticación');
            }

            // Actualizar el estado optimistamente
            setSettings(prev => ({ ...prev, [key]: value }));

            const response = await fetch(`${API_URL}/settings/notifications`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    ...settings,
                    [key]: value
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error de respuesta:', response.status, errorText);
                throw new Error(`Error al guardar configuración: ${response.status}`);
            }

            const updatedData = await response.json() as NotificationSettingsData;
            console.log('Configuración actualizada:', updatedData);

            // Actualizar el estado con los datos del servidor
            setSettings(updatedData);
            toast.success('Configuración actualizada');
        } catch (error: unknown) {
            console.error('Error guardando configuración:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al guardar la configuración: ' + errorMessage);
            // Revertir el cambio en caso de error
            setSettings(prev => ({ ...prev, [key]: !value }));
            if (error instanceof Error && error.message.includes('token')) {
                router.push('/login');
            }
        }
    };

    if (!user || !token) {
        return null;
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <span>Cargando configuración...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>
                    Personaliza cómo y cuándo recibes notificaciones
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Canales</h3>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email">Email</Label>
                            <Switch
                                id="email"
                                checked={settings.emailEnabled}
                                onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Switch
                                id="whatsapp"
                                checked={settings.phoneEnabled}
                                onCheckedChange={(checked) => updateSetting('phoneEnabled', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="push">Notificaciones Push</Label>
                            <Switch
                                id="push"
                                checked={settings.pushEnabled}
                                onCheckedChange={(checked) => updateSetting('pushEnabled', checked)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Eventos</h3>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="booking">Nuevas reservas</Label>
                            <Switch
                                id="booking"
                                checked={settings.notifyOnBooking}
                                onCheckedChange={(checked) => updateSetting('notifyOnBooking', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkin">Check-in</Label>
                            <Switch
                                id="checkin"
                                checked={settings.notifyOnCheckIn}
                                onCheckedChange={(checked) => updateSetting('notifyOnCheckIn', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkout">Check-out</Label>
                            <Switch
                                id="checkout"
                                checked={settings.notifyOnCheckOut}
                                onCheckedChange={(checked) => updateSetting('notifyOnCheckOut', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="message">Nuevos mensajes</Label>
                            <Switch
                                id="message"
                                checked={settings.notifyOnMessage}
                                onCheckedChange={(checked) => updateSetting('notifyOnMessage', checked)}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 