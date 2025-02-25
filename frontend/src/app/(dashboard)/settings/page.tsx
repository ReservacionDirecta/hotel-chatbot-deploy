'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AISettings } from './components/AISettings';
import { NotificationSettings } from './components/NotificationSettings';
import { WhatsAppSettingsV2 } from './components/WhatsAppSettingsV2';

export default function SettingsPage() {
    return (
        <div className="container py-6 space-y-6">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
                <p className="text-muted-foreground">
                    Administra la configuración de tu aplicación
                </p>
            </div>
            <Tabs defaultValue="whatsapp" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    <TabsTrigger value="ai">Inteligencia Artificial</TabsTrigger>
                    <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                </TabsList>
                <TabsContent value="whatsapp" className="space-y-4">
                    <WhatsAppSettingsV2 />
                </TabsContent>
                <TabsContent value="ai" className="space-y-4">
                    <AISettings />
                </TabsContent>
                <TabsContent value="notifications" className="space-y-4">
                    <NotificationSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
} 