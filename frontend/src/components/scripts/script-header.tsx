import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function ScriptHeader() {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Scripts</h2>
                <p className="text-muted-foreground">
                    Gestiona los scripts de respuesta automática
                </p>
            </div>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Script
            </Button>
        </div>
    )
} 