import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(event.currentTarget);
            const email = formData.get('email');
            const password = formData.get('password');

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al iniciar sesión');
            }

            const data = await response.json();

            // Guardar el token en las cookies
            if (data.token) {
                Cookies.set('auth-token', data.token, {
                    expires: 1, // 1 día
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });
            }

            toast.success('Sesión iniciada correctamente');
            router.push('/conversations');
        } catch (error) {
            console.error('Error de login:', error);
            toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                    id="email"
                    name="email"
                    placeholder="ejemplo@correo.com"
                    required
                    type="email"
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                    id="password"
                    name="password"
                    required
                    type="password"
                    disabled={isLoading}
                />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
        </form>
    );
} 