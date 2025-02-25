import { getAuthToken } from '@/lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = `${BASE_URL}/whatsapp`;

async function fetchWithRetry(url: string, options: RequestInit = {}) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Error en la petición: ${response.status} ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error en fetchWithRetry:', error);
    throw error;
  }
}

export async function getStatus() {
  return fetchWithRetry(`${API_BASE_URL}/status`);
}

export async function getQR() {
  return fetchWithRetry(`${API_BASE_URL}/qr`);
}

export async function logout() {
  return fetchWithRetry(`${API_BASE_URL}/logout`, {
    method: 'POST'
  });
}

export async function getConversations() {
  return fetchWithRetry(`${API_BASE_URL}/conversations`);
}

export async function sendMessage(to: string, message: string) {
  return fetchWithRetry(`${API_BASE_URL}/send`, {
    method: 'POST',
    body: JSON.stringify({ to, message })
  });
}

export async function sendFile(to: string, file: File) {
  const formData = new FormData();
  formData.append('to', to);
  
  if (file.type.startsWith('audio/')) {
    // Para archivos de audio, asegurarse de que se envíen como audio/ogg
    const blob = new Blob([file], { type: 'audio/ogg' });
    formData.append('files', blob, file.name.replace(/\.[^/.]+$/, '') + '.ogg');
  } else {
    formData.append('files', file);
  }

  const token = await getAuthToken();
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  return fetchWithRetry(`${API_BASE_URL}/send-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
}

export async function getMedia(messageId: string) {
  return fetchWithRetry(`${API_BASE_URL}/media/${messageId}`);
} 