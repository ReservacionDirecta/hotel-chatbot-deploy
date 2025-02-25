export class NotificationService {
    private static notificationSound: HTMLAudioElement;

    static initialize() {
        this.notificationSound = new Audio('/sounds/notification.mp3');
    }

    static async playNotificationSound() {
        try {
            await this.notificationSound.play();
        } catch (error) {
            console.error('Error al reproducir el sonido de notificación:', error);
        }
    }

    static async requestPermission() {
        if (!('Notification' in window)) {
            console.log('Este navegador no soporta notificaciones de escritorio');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error al solicitar permisos de notificación:', error);
            return false;
        }
    }

    static async showNotification(title: string, options?: NotificationOptions) {
        if (!('Notification' in window)) {
            return;
        }

        try {
            const permission = await this.requestPermission();
            if (permission) {
                new Notification(title, options);
            }
        } catch (error) {
            console.error('Error al mostrar la notificación:', error);
        }
    }

    static async notify(message: string) {
        await this.playNotificationSound();
        await this.showNotification('Nuevo mensaje', {
            body: message,
            icon: '/favicon.ico'
        });
    }
} 