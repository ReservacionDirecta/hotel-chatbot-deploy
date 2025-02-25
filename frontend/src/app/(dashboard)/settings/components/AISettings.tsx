'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import * as ai from '@/lib/ai-client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from '@/hooks/use-socket';

const AI_PROVIDERS = {
    glhf: {
        name: 'GLHF (Compatible con OpenAI)',
        baseURL: 'https://glhf.chat/api/openai/v1',
        models: [
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'gpt-4', name: 'GPT-4' }
        ]
    },
    kluster: {
        name: 'Kluster AI',
        baseURL: 'https://api.kluster.ai/v1',
        models: [
            {
                id: 'klusterai/Meta-Llama-3.1-8B-Instruct-Turbo',
                name: 'Llama 3.1 8B Instruct Turbo'
            },
            {
                id: 'klusterai/Meta-Llama-3.1-405B-Instruct-Turbo',
                name: 'Llama 3.1 405B Instruct Turbo'
            },
            {
                id: 'klusterai/Meta-Llama-3.3-70B-Instruct-Turbo',
                name: 'Llama 3.3 70B Instruct Turbo'
            },
            {
                id: 'deepseek-ai/DeepSeek-R1',
                name: 'DeepSeek R1'
            }
        ],
        defaultApiKey: 'api:2b912469-b12e-41f6-a7a2-c065aa47197d'
    }
};

export function AISettings() {
    const router = useRouter();
    const auth = useAuth();
    const socket = useSocket('/system'); // Socket para el sistema

    const [config, setConfig] = useState({
        provider: 'kluster',
        apiKey: '',
        baseURL: AI_PROVIDERS.kluster.baseURL,
        model: AI_PROVIDERS.kluster.models[0].id,
        exchangeRate: '3.70',
        customInstructions: ''
    });
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeModel, setActiveModel] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                if (!auth.token) {
                    throw new Error('No se encontró el token de autenticación');
                }
                setInitialized(true);
                await fetchConfig();
            } catch (error) {
                handleError(error);
            }
        };

        init();
    }, [auth.token]);

    // Efecto para escuchar actualizaciones del estado del sistema
    useEffect(() => {
        if (socket) {
            const handleStatusUpdate = (data: any) => {
                console.log('=== ACTUALIZACIÓN DE ESTADO RECIBIDA ===', data);
                if (data.status?.aiModel) {
                    setActiveModel(data.status.aiModel);

                    // Mostrar alerta si el modelo activo es diferente al configurado
                    if (config.model !== data.status.aiModel) {
                        toast.warning(
                            `El modelo activo (${data.status.aiModel}) es diferente al configurado (${config.model}). 
                            Los cambios se aplicarán en el próximo reinicio del servicio.`
                        );
                    }
                }
            };

            socket.on('status_update', handleStatusUpdate);

            // Solicitar estado actual
            socket.emit('get_status');

            return () => {
                socket.off('status_update', handleStatusUpdate);
            };
        }
    }, [socket, config.model]);

    const handleError = (error: Error | unknown) => {
        console.error('Error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMsg);

        if (errorMsg.toLowerCase().includes('401') ||
            errorMsg.toLowerCase().includes('token') ||
            errorMsg.toLowerCase().includes('sesión')) {
            toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            auth.logout();
            router.push('/login');
            return;
        }

        toast.error(errorMsg);
    };

    const fetchConfig = async () => {
        if (!auth.token) {
            handleError(new Error('No se encontró el token de autenticación'));
            return;
        }

        try {
            setError(null);
            setLoading(true);
            const data = await ai.getAIConfig();

            if (!data) {
                throw new Error('No se pudo obtener la configuración');
            }

            setConfig(prevConfig => ({
                ...prevConfig,
                ...data,
                apiKey: data.apiKey || (data.provider === 'kluster' ? AI_PROVIDERS.kluster.defaultApiKey : '')
            }));
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderChange = (provider: string) => {
        try {
            const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
            if (!providerConfig) {
                throw new Error('Proveedor no válido');
            }

            setConfig(prevConfig => ({
                ...prevConfig,
                provider,
                baseURL: providerConfig.baseURL,
                model: providerConfig.models[0].id,
                apiKey: prevConfig.apiKey || (provider === 'kluster' ? AI_PROVIDERS.kluster.defaultApiKey : '')
            }));
        } catch (error) {
            handleError(error);
        }
    };

    const handleModelChange = async (modelId: string) => {
        try {
            if (!auth.token) {
                throw new Error('No se encontró el token de autenticación');
            }

            setConfig(prevConfig => ({
                ...prevConfig,
                model: modelId
            }));
        } catch (error) {
            handleError(error);
        }
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const newApiKey = e.target.value.trim();
            setConfig(prevConfig => ({
                ...prevConfig,
                apiKey: newApiKey || (config.provider === 'kluster' ? AI_PROVIDERS.kluster.defaultApiKey : '')
            }));
        } catch (error) {
            handleError(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!auth.token) {
            handleError(new Error('No se encontró el token de autenticación'));
            return;
        }

        // Validaciones adicionales
        if (!config.provider) {
            toast.error('Selecciona un proveedor de IA');
            return;
        }

        if (config.provider !== 'kluster' && !config.apiKey) {
            toast.error('La API Key es requerida para este proveedor');
            return;
        }

        if (!config.model) {
            toast.error('Selecciona un modelo de IA');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                provider: config.provider,
                apiKey: config.apiKey || AI_PROVIDERS.kluster.defaultApiKey,
                baseURL: config.baseURL,
                model: config.model,
                exchangeRate: config.exchangeRate,
                customInstructions: config.customInstructions
            };

            const response = await ai.updateAIConfig(payload);

            if (!response) {
                throw new Error('No se recibió respuesta del servidor');
            }

            toast.success('Configuración guardada correctamente');

            if (activeModel && config.model !== activeModel) {
                toast.info('Los cambios en el modelo se aplicarán en el próximo reinicio del servicio');
            }

            setConfig(prevConfig => ({
                ...prevConfig,
                ...response,
                apiKey: response.apiKey || prevConfig.apiKey
            }));
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                    <CardDescription>Se produjo un error al cargar la configuración</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-red-500">{error}</div>
                </CardContent>
            </Card>
        );
    }

    if (!initialized || !auth.isAuthenticated) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cargando...</CardTitle>
                    <CardDescription>Verificando autenticación</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-4 px-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración de IA</CardTitle>
                        <CardDescription>
                            Configura los parámetros de la inteligencia artificial
                            {activeModel && (
                                <div className="mt-2 text-sm">
                                    Modelo activo: <span className="font-medium">{activeModel}</span>
                                    {activeModel !== config.model && (
                                        <span className="ml-2 text-yellow-500">
                                            (Pendiente de aplicar cambios)
                                        </span>
                                    )}
                                </div>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="provider">Proveedor de IA</Label>
                                    <Select
                                        value={config.provider}
                                        onValueChange={handleProviderChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un proveedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                                                <SelectItem key={key} value={key}>
                                                    {provider.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="model">Modelo de IA</Label>
                                    <Select
                                        value={config.model}
                                        onValueChange={handleModelChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un modelo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AI_PROVIDERS[config.provider as keyof typeof AI_PROVIDERS].models.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        Selecciona el modelo de IA que mejor se adapte a tus necesidades
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">
                                        API Key {config.provider === 'kluster' && config.apiKey === AI_PROVIDERS.kluster.defaultApiKey && '(Pre-configurada)'}
                                    </Label>
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        value={config.apiKey}
                                        onChange={handleApiKeyChange}
                                        placeholder={config.provider === 'kluster' ?
                                            "Usa la API key pre-configurada o ingresa una propia" :
                                            "Ingresa tu API key"}
                                        disabled={loading}
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck="false"
                                        data-form-type="other"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        {config.provider === 'kluster' && config.apiKey === AI_PROVIDERS.kluster.defaultApiKey
                                            ? 'Estás usando la API key pre-configurada. Puedes cambiarla si lo deseas.'
                                            : config.provider === 'kluster'
                                                ? 'Estás usando una API key personalizada. Déjala en blanco para usar la pre-configurada.'
                                                : 'Ingresa una API key válida para este proveedor'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="baseURL">URL Base</Label>
                                    <Input
                                        id="baseURL"
                                        type="text"
                                        value={config.baseURL}
                                        disabled
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        La URL base se configura automáticamente según el proveedor seleccionado
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exchangeRate">Tipo de Cambio del Día (USD a PEN)</Label>
                                    <Input
                                        id="exchangeRate"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={config.exchangeRate}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            exchangeRate: e.target.value
                                        }))}
                                        placeholder="Ej: 3.70"
                                        disabled={loading}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Este valor se usará para convertir precios de USD a PEN en las respuestas del chatbot
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customInstructions">Instrucciones Personalizadas</Label>
                                    <textarea
                                        id="customInstructions"
                                        className="w-full min-h-[200px] p-2 border rounded-md resize-y"
                                        value={config.customInstructions}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            customInstructions: e.target.value
                                        }))}
                                        placeholder="Escribe las instrucciones personalizadas para el chatbot..."
                                        disabled={loading}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Estas instrucciones ayudarán al chatbot a entender cómo debe comportarse y manejar las conversiones de moneda
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fetchConfig()}
                                        disabled={loading}
                                    >
                                        Restaurar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="min-w-[120px]"
                                    >
                                        {loading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                <span>Guardando...</span>
                                            </div>
                                        ) : 'Guardar cambios'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
} 