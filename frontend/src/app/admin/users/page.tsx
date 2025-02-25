'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'

interface User {
    id: string
    email: string
    name: string
    role: string
    createdAt: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'user'
    })
    const router = useRouter()
    const { isAuthenticated, token } = useAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }
        fetchUsers()
    }, [isAuthenticated, router])

    const fetchUsers = async () => {
        try {
            const data = await apiClient('/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            setUsers(data)
        } catch (error) {
            console.error('Error al cargar usuarios:', error)
            if (error instanceof Error && error.message.includes('401')) {
                toast.error('No autorizado. Redirigiendo al login...')
                router.push('/login')
                return
            }
            toast.error('Error al cargar usuarios: ' + (error instanceof Error ? error.message : 'Error desconocido'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await apiClient('/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            toast.success('Usuario creado exitosamente')
            setIsDialogOpen(false)
            fetchUsers()
            setFormData({
                email: '',
                name: '',
                password: '',
                role: 'user'
            })
        } catch (error) {
            console.error('Error al crear usuario:', error)
            if (error instanceof Error && error.message.includes('401')) {
                toast.error('No autorizado. Redirigiendo al login...')
                router.push('/login')
                return
            }
            toast.error('Error al crear usuario: ' + (error instanceof Error ? error.message : 'Error desconocido'))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            return
        }

        try {
            await apiClient(`/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            toast.success('Usuario eliminado exitosamente')
            fetchUsers()
        } catch (error) {
            console.error('Error al eliminar usuario:', error)
            if (error instanceof Error && error.message.includes('401')) {
                toast.error('No autorizado. Redirigiendo al login...')
                router.push('/login')
                return
            }
            toast.error('Error al eliminar usuario: ' + (error instanceof Error ? error.message : 'Error desconocido'))
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-lg">Cargando usuarios...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Administración de Usuarios</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Crear Usuario</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="role">Rol</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Usuario</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">
                                Crear Usuario
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {users.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-500">No hay usuarios registrados</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Fecha de Creación</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        Eliminar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    )
} 