import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

export function middleware(request: NextRequest) {
  // Evitar procesar rutas estáticas y API
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/api') ||
      request.nextUrl.pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Obtener el token de la cookie
  const token = request.cookies.get('auth-token')?.value

  // Rutas protegidas que requieren autenticación
  const protectedPaths = ['/dashboard', '/admin', '/settings', '/conversations', '/rooms', '/training', '/scripts']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Si es una ruta protegida y no hay token, redirigir al login
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay token, verificar que sea válido y no haya expirado
  if (token) {
    try {
      const decoded = jwtDecode(token)
      const now = Date.now() / 1000

      if (!decoded.exp || decoded.exp <= now) {
        // Token expirado, redirigir al login
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth-token')
        return response
      }

      // Verificar rutas de administrador
      if (request.nextUrl.pathname.startsWith('/admin') && decoded.role !== 'admin') {
        // Usuario no es administrador, redirigir al dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch {
      // Token inválido, redirigir al login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/conversations/:path*',
    '/rooms/:path*',
    '/training/:path*',
    '/scripts/:path*',
  ]
} 