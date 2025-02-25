const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function apiClient(endpoint: string, options: RequestInit = {}) {
    // Asegurarse de que el endpoint comience con /api
    const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    
    // No establecer Content-Type si estamos enviando un FormData
    const defaultHeaders = options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
                errorData?.message || 
                `Error ${response.status}: ${response.statusText}`
            );
        }

        return response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Error de conexión con el servidor');
    }
} 