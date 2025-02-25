export function getAuthToken(): string | null {
    try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const { state } = JSON.parse(authStorage);
            return state.token;
        }
        return null;
    } catch (error) {
        console.error('Error al obtener el token:', error);
        return null;
    }
} 