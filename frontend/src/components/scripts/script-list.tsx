import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Script {
    id: string
    name: string
    content: string
    isActive: boolean
    createdAt: string
}

export function ScriptList() {
    const [scripts, setScripts] = useState<Script[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchScripts()
    }, [])

    const fetchScripts = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scripts`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            })

            if (!response.ok) throw new Error('Error al cargar scripts')

            const data = await response.json()
            setScripts(data)
        } catch (error) {
            toast.error('Error al cargar los scripts')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleScript = async (scriptId: string, isActive: boolean) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/scripts/${scriptId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ isActive }),
                }
            )

            if (!response.ok) throw new Error('Error al actualizar script')

            setScripts((prev) =>
                prev.map((script) =>
                    script.id === scriptId ? { ...script, isActive } : script
                )
            )

            toast.success('Script actualizado correctamente')
        } catch (error) {
            toast.error('Error al actualizar el script')
        }
    }

    if (isLoading) {
        return <div className="text-center">Cargando scripts...</div>
    }

    if (scripts.length === 0) {
        return (
            <div className="text-center text-muted-foreground">
                No hay scripts disponibles
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {scripts.map((script) => (
                <div
                    key={script.id}
                    className="rounded-lg border p-4 hover:bg-muted/50"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">{script.name}</h3>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={script.isActive}
                                onChange={(e) => toggleScript(script.id, e.target.checked)}
                                aria-label={`Activar script ${script.name}`}
                                title={`Activar/Desactivar ${script.name}`}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
                            <span className="sr-only">Activar script {script.name}</span>
                        </label>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {script.content.substring(0, 100)}...
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                        Creado el: {new Date(script.createdAt).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    )
} 