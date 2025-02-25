import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

interface NotificationSettings {
    emailEnabled: boolean;
    phoneEnabled: boolean;
    pushEnabled: boolean;
    notifyOnBooking: boolean;
    notifyOnCheckIn: boolean;
    notifyOnCheckOut: boolean;
    notifyOnMessage: boolean;
}

export function useSettings() {
    const { token } = useAuth();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        loadSettings();
    }, [token]);

    const loadSettings = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Error cargando configuración');
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error cargando configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/notifications`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSettings)
            });

            if (!response.ok) throw new Error('Error actualizando configuración');
            const data = await response.json();
            setSettings(data);
            return true;
        } catch (error) {
            console.error('Error actualizando configuración:', error);
            return false;
        }
    };

    return {
        settings,
        loading,
        updateSettings,
        reloadSettings: loadSettings
    };
} 