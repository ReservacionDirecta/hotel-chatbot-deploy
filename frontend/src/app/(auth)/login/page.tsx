'use client'

import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex">
      {/* Lado izquierdo - Imagen y mensaje */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />
        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div>
            <h1 className="text-4xl font-bold">Hotel Chatbot</h1>
            <p className="mt-2 text-lg text-white/80">
              Sistema inteligente de gestión de conversaciones
            </p>
          </div>
          <div className="space-y-6">
            <blockquote className="text-lg italic">
              "Este chatbot ha revolucionado la forma en que interactuamos con nuestros huéspedes,
              proporcionando respuestas rápidas y precisas 24/7."
            </blockquote>
            <div>
              <p className="font-semibold">María González</p>
              <p className="text-sm text-white/70">Gerente de Hotel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario de login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Inicia sesión para acceder al panel de administración
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
