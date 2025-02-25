const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getAuthToken() {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) {
      throw new Error('No se encontró el token de autenticación');
    }

    const parsed = JSON.parse(authStorage);
    const state = parsed.state;

    if (!state?.token) {
      throw new Error('Token no encontrado');
    }

    return state.token;
  } catch (error) {
    console.error('Error al obtener el token:', error);
    throw new Error('Error de autenticación: ' + (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

async function fetchWithRetry(endpoint: string, options: RequestInit = {}, retries = 3): Promise<any> {
  let lastError;
  let attempt = 0;

  // Limpiar y construir la URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  console.log('Intentando conectar a:', url);

  while (attempt < retries) {
    attempt++;
    try {
      const token = await getAuthToken();
      
      // Preparar headers base
      const baseHeaders: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };

      // Agregar Content-Type solo si no es FormData
      if (!(options.body instanceof FormData)) {
        baseHeaders['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...baseHeaders,
          ...options.headers
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en la respuesta:', {
          url,
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        if (response.status === 401) {
          throw new Error('401: Sesión expirada - Por favor, inicie sesión nuevamente');
        }
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      console.error(`Intento ${attempt} fallido:`, error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.log(`Error de conexión, reintentando en ${attempt} segundos...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      
      if (error instanceof Error && 
          (error.message.includes('401') || 
           error.message.toLowerCase().includes('token') || 
           error.message.toLowerCase().includes('sesión'))) {
        throw error;
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
    }
  }

  throw lastError;
}

export async function getAIConfig() {
  try {
    console.log('Obteniendo configuración de IA...');
    const data = await fetchWithRetry('/settings/ai');
    return {
      ...data,
      baseURL: data.baseURL || 'https://api.kluster.ai/v1',
      exchangeRate: data.exchangeRate || '3.70',
      customInstructions: data.customInstructions || `Eres un asistente virtual del Hotel Cascade...`
    };
  } catch (error) {
    console.error('Error al obtener la configuración de IA:', error);
    throw error;
  }
}

export async function updateAIConfig(config: {
  provider: string;
  apiKey: string;
  baseURL: string;
  model: string;
  exchangeRate?: string;
  customInstructions?: string;
}) {
  try {
    console.log('Actualizando configuración de IA...');
    return await fetchWithRetry('/settings/ai', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  } catch (error) {
    console.error('Error al actualizar la configuración de IA:', error);
    throw error;
  }
}

export async function uploadTrainingFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return await fetchWithRetry('/ai/training/upload', {
    method: 'POST',
    body: formData
  });
}

export async function getAllTrainings() {
  return await fetchWithRetry('/ai/training');
}

export async function getTrainingStatus(trainingId: string) {
  return await fetchWithRetry(`/ai/training/${trainingId}/status`);
}

export async function startTraining(trainingId: string) {
  return await fetchWithRetry(`/ai/training/${trainingId}/start`, {
    method: 'POST'
  });
}