'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

const formSchema = z.object({
    email: z.string().email({
        message: 'Por favor ingrese un email válido.',
    }),
    password: z.string().min(6, {
        message: 'La contraseña debe tener al menos 6 caracteres.',
    }),
})

export function LoginForm() {
    const router = useRouter()
    const { login, isAuthenticated } = useAuth()
    const [loading, setLoading] = React.useState(false)

    // Redirigir si ya está autenticado
    React.useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, router])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (loading) return

        try {
            setLoading(true)

            const data = await apiClient('/auth/login', {
                method: 'POST',
                body: JSON.stringify(values),
            });

            if (!data.token) {
                throw new Error('Credenciales inválidas')
            }

            const loginSuccess = await login(data.token)

            if (loginSuccess) {
                toast.success('Inicio de sesión exitoso')
                router.push('/dashboard')
            } else {
                throw new Error('Error al iniciar sesión')
            }

        } catch (error) {
            console.error('Error completo:', error);
            toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
            </form>
        </Form>
    )
} 