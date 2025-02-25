'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import {
    Plus,
    Pencil,
    Trash2,
    MessageSquare,
    AlertCircle
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'

interface Script {
    id: number
    name: string
    description: string
    active: boolean
    triggers: string // JSON string
    response: string
    category?: string
    requiresDate?: boolean
    requiresRoomType?: boolean
    requiresOccupancy?: boolean
}

const initialScripts: Script[] = [
    {
        id: 1,
        name: 'Bienvenida',
        description: 'Mensaje de bienvenida para nuevos clientes',
        active: true,
        triggers: JSON.stringify(['hola', 'buenos días', 'buenas tardes']),
        response: '¡Bienvenido al Hotel! ¿En qué puedo ayudarte?',
        category: 'general'
    },
    {
        id: 2,
        name: 'Reservaciones',
        description: 'Información sobre el proceso de reserva',
        active: true,
        triggers: JSON.stringify(['reservar', 'habitación', 'disponibilidad']),
        response: 'Para hacer una reserva, necesitamos los siguientes datos: fechas de estadía, tipo de habitación y número de huéspedes.',
        category: 'reservaciones'
    },
    {
        id: 3,
        name: 'Precios',
        description: 'Información sobre tarifas y promociones',
        active: false,
        triggers: JSON.stringify(['precio', 'tarifa', 'costo']),
        response: 'Nuestras tarifas varían según la temporada y tipo de habitación. ¿Te gustaría conocer las tarifas actuales?',
        category: 'precios'
    },
]

export default function ScriptsPage() {
    const [scripts, setScripts] = useState<Script[]>([])
    const [editingScript, setEditingScript] = useState<Script | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null)
    const [newTrigger, setNewTrigger] = useState('')
    const { token } = useAuth()

    // Función auxiliar para parsear triggers
    const parseTriggers = (script: Script | null): string[] => {
        if (!script || !script.triggers) return [];
        try {
            const parsed = JSON.parse(script.triggers);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error parsing triggers:', error);
            return [];
        }
    };

    // Función auxiliar para serializar triggers
    const serializeTriggers = (triggers: string[]): string => {
        return JSON.stringify(triggers || []);
    };

    const fetchScripts = useCallback(async () => {
        if (!token) return;

        try {
            const data = await apiClient('/scripts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setScripts(data);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar los scripts');
        }
    }, [token]);

    useEffect(() => {
        fetchScripts();
    }, [fetchScripts]);

    const handleCreateScript = () => {
        const newScript: Script = {
            id: 0,
            name: 'Nuevo Script',
            description: 'Descripción del nuevo script',
            active: true,
            triggers: '[]',
            response: '',
            category: 'general'
        };
        setEditingScript(newScript);
        setIsDialogOpen(true);
    };

    const handleSaveScript = async () => {
        if (!editingScript || !token) return;

        // Validar datos antes de enviar
        if (!editingScript.name?.trim()) {
            toast.error('El nombre es requerido');
            return;
        }
        if (!editingScript.response?.trim()) {
            toast.error('La respuesta es requerida');
            return;
        }
        if (!parseTriggers(editingScript).length) {
            toast.error('Se requiere al menos una palabra clave');
            return;
        }

        try {
            const data = await apiClient('/scripts' + (editingScript.id ? `/${editingScript.id}` : ''), {
                method: editingScript.id ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...editingScript,
                    name: editingScript.name.trim(),
                    description: editingScript.description?.trim() || '',
                    response: editingScript.response.trim(),
                    triggers: parseTriggers(editingScript).map(t => t.trim())
                })
            });

            await fetchScripts();
            setIsDialogOpen(false);
            toast.success(editingScript.id ? 'Script actualizado exitosamente' : 'Script creado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            toast.error(error instanceof Error ? error.message : 'Error al guardar el script');
        }
    };

    const handleEdit = (script: Script) => {
        setEditingScript({
            ...script,
            triggers: script.triggers || '[]'
        });
        setIsDialogOpen(true);
    };

    const removeTrigger = (triggerToRemove: string) => {
        if (!editingScript) return;

        const currentTriggers = parseTriggers(editingScript);
        const updatedTriggers = currentTriggers.filter(t => t !== triggerToRemove);

        setEditingScript({
            ...editingScript,
            triggers: serializeTriggers(updatedTriggers)
        });
    };

    const addTrigger = (newTrigger: string) => {
        if (!editingScript || !newTrigger.trim()) return;

        const currentTriggers = parseTriggers(editingScript);
        if (!currentTriggers.includes(newTrigger)) {
            const updatedTriggers = [...currentTriggers, newTrigger];
            setEditingScript({
                ...editingScript,
                triggers: serializeTriggers(updatedTriggers)
            });
        }
        setNewTrigger('');
    };

    const handleDelete = async (script: Script) => {
        setScriptToDelete(script);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!scriptToDelete || !token) return;

        try {
            await apiClient(`/scripts/${scriptToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setScripts(scripts.filter(s => s.id !== scriptToDelete.id));
            setDeleteConfirmOpen(false);
            setScriptToDelete(null);
            toast.success('Script eliminado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            toast.error(error instanceof Error ? error.message : 'Error al eliminar el script');
        }
    };

    const toggleScript = async (id: number) => {
        if (!token) {
            toast.error('No hay sesión activa');
            return;
        }

        const script = scripts.find(s => s.id === id);
        if (!script) {
            toast.error('Script no encontrado');
            return;
        }

        try {
            // Actualización optimista
            setScripts(scripts.map(s =>
                s.id === id ? { ...s, active: !s.active } : s
            ));

            const data = await apiClient(`/scripts/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ active: !script.active })
            });

            setScripts(scripts.map(s =>
                s.id === id ? data : s
            ));
            toast.success(`Script ${data.active ? 'activado' : 'desactivado'} exitosamente`);
        } catch (error) {
            // Revertir cambio optimista
            setScripts(scripts.map(s =>
                s.id === id ? { ...s, active: s.active } : s
            ));
            console.error('Error:', error);
            toast.error(error instanceof Error ? error.message : 'Error al actualizar el script');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Scripts</h2>
                    <p className="text-muted-foreground">
                        Gestiona los scripts de respuesta automática
                    </p>
                </div>
                <Button onClick={handleCreateScript}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Script
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scripts.map((script) => (
                    <Card key={script.id} className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-semibold">{script.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {script.description}
                                </p>
                            </div>
                            <Switch
                                checked={script.active}
                                onCheckedChange={() => toggleScript(script.id)}
                            />
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-medium">Palabras clave:</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {parseTriggers(script).map((trigger, index) => (
                                    <span
                                        key={index}
                                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                                    >
                                        {trigger}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(script)}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDelete(script)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Diálogo de edición */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
                        <DialogTitle>
                            {editingScript?.id ? 'Editar Script' : 'Nuevo Script'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingScript?.id
                                ? 'Modifica los detalles del script de respuesta automática.'
                                : 'Crea un nuevo script de respuesta automática.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={editingScript?.name || ''}
                                onChange={(e) => setEditingScript(editingScript ? {
                                    ...editingScript,
                                    name: e.target.value
                                } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Input
                                id="description"
                                value={editingScript?.description || ''}
                                onChange={(e) => setEditingScript(editingScript ? {
                                    ...editingScript,
                                    description: e.target.value
                                } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoría</Label>
                            <select
                                id="category"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={editingScript?.category || 'general'}
                                onChange={(e) => setEditingScript(editingScript ? {
                                    ...editingScript,
                                    category: e.target.value
                                } : null)}
                            >
                                <option value="general">General</option>
                                <option value="reservas">Reservas</option>
                                <option value="servicios">Servicios</option>
                                <option value="precios">Precios</option>
                                <option value="instalaciones">Instalaciones</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Palabras clave</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {editingScript && parseTriggers(editingScript).map((trigger, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => removeTrigger(trigger)}
                                    >
                                        {trigger} ×
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nueva palabra clave"
                                    value={newTrigger}
                                    onChange={(e) => setNewTrigger(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addTrigger(e.target.value)}
                                />
                                <Button type="button" onClick={() => addTrigger(newTrigger)}>
                                    Agregar
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="response">Respuesta</Label>
                            <Textarea
                                id="response"
                                rows={5}
                                value={editingScript?.response || ''}
                                onChange={(e) => setEditingScript(editingScript ? {
                                    ...editingScript,
                                    response: e.target.value
                                } : null)}
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="requiresDate"
                                    checked={editingScript?.requiresDate || false}
                                    onCheckedChange={(checked) => setEditingScript(editingScript ? {
                                        ...editingScript,
                                        requiresDate: checked
                                    } : null)}
                                />
                                <Label htmlFor="requiresDate">Requiere fecha</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="requiresRoomType"
                                    checked={editingScript?.requiresRoomType || false}
                                    onCheckedChange={(checked) => setEditingScript(editingScript ? {
                                        ...editingScript,
                                        requiresRoomType: checked
                                    } : null)}
                                />
                                <Label htmlFor="requiresRoomType">Requiere tipo de habitación</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="requiresOccupancy"
                                    checked={editingScript?.requiresOccupancy || false}
                                    onCheckedChange={(checked) => setEditingScript(editingScript ? {
                                        ...editingScript,
                                        requiresOccupancy: checked
                                    } : null)}
                                />
                                <Label htmlFor="requiresOccupancy">Requiere número de huéspedes</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="sticky bottom-0 bg-background z-10 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveScript}
                            disabled={!editingScript?.name || !editingScript?.response}
                        >
                            {editingScript?.id ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación de eliminación */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar el script "{scriptToDelete?.name}"?
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="outline" className="text-red-500 hover:text-red-700" onClick={confirmDelete}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 