'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import Cookies from 'js-cookie'

interface User {
    id: string
    email: string
    name: string
    role: string
}

interface AuthState {
    token: string | null
    isAuthenticated: boolean
    user: User | null
    login: (token: string) => Promise<boolean>
    logout: () => void
    checkAuth: () => boolean
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            isAuthenticated: false,
            user: null,

            login: async (token: string) => {
                try {
                    const decoded = jwtDecode(token)
                    const now = Date.now() / 1000

                    if (!decoded.exp || decoded.exp <= now) {
                        set({
                            token: null,
                            isAuthenticated: false,
                            user: null
                        })
                        Cookies.remove('auth-token')
                        return false
                    }

                    // Guardar token en cookie
                    Cookies.set('auth-token', token, {
                        expires: new Date(decoded.exp * 1000),
                        path: '/'
                    })

                    set({
                        token,
                        isAuthenticated: true,
                        user: decoded as User
                    })

                    return true
                } catch (error) {
                    console.error('Error en login:', error)
                    set({
                        token: null,
                        isAuthenticated: false,
                        user: null
                    })
                    Cookies.remove('auth-token')
                    return false
                }
            },

            logout: () => {
                set({
                    token: null,
                    isAuthenticated: false,
                    user: null
                })
                Cookies.remove('auth-token')
                window.location.href = '/login'
            },

            checkAuth: () => {
                const token = Cookies.get('auth-token')
                if (!token) {
                    set({
                        token: null,
                        isAuthenticated: false,
                        user: null
                    })
                    return false
                }

                try {
                    const decoded = jwtDecode(token)
                    const now = Date.now() / 1000

                    if (!decoded.exp || decoded.exp <= now) {
                        set({
                            token: null,
                            isAuthenticated: false,
                            user: null
                        })
                        Cookies.remove('auth-token')
                        return false
                    }

                    set({
                        token,
                        isAuthenticated: true,
                        user: decoded as User
                    })
                    return true
                } catch {
                    set({
                        token: null,
                        isAuthenticated: false,
                        user: null
                    })
                    Cookies.remove('auth-token')
                    return false
                }
            }
        }),
        {
            name: 'auth-storage',
            skipHydration: true,
            partialize: (state) => ({
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                user: state.user
            })
        }
    )
)
