import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient as api } from '@/lib/api'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  plan: string
  token?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const cleanupAuthState = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('refresh_token')
    // Clear any Supabase remnants
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    })
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key)
      }
    })
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await api.auth.login(email, password)
      
      // Verificar que la respuesta tenga la estructura esperada
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server')
      }
      
      const { user: userData, tokens } = response.data.data
      
      if (!tokens || !tokens.accessToken) {
        throw new Error('No access token received from server')
      }
      
      const token = tokens.accessToken
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(userData))
      setUser(userData)
      
      toast.success('¡Sesión iniciada exitosamente!')
    } catch (error: unknown) {
      console.error('Error signing in:', error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al iniciar sesión'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      // Generate username from email
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      // Split name into first and last name
      const nameParts = name.trim().split(' ')
      const first_name = nameParts[0] || 'User'
      const last_name = nameParts.slice(1).join(' ') || 'Name'
      
      const response = await api.auth.register(email, password, username, first_name, last_name)
      
      // Verificar que la respuesta tenga la estructura esperada
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server')
      }
      
      const { user: userData, tokens } = response.data.data
      
      if (!tokens || !tokens.accessToken) {
        throw new Error('No access token received from server')
      }
      
      const token = tokens.accessToken
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(userData))
      setUser(userData)
      
      toast.success('¡Cuenta creada exitosamente!')
    } catch (error: unknown) {
      console.error('Error signing up:', error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al crear cuenta'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      try {
        await api.auth.logout()
      } catch (err) {
        // Continue even if this fails
      }
      
      cleanupAuthState()
      setUser(null)
      
      toast.success('Has cerrado sesión exitosamente')
      window.location.href = '/auth'
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Error al cerrar sesión')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.auth.updateProfile(data)
      const updatedUser = response.data.data.user
      
      localStorage.setItem('user_data', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      toast.success('Perfil actualizado exitosamente')
    } catch (error: unknown) {
      console.error('Error updating profile:', error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al actualizar perfil'
      toast.error(message)
      throw error
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await api.auth.forgotPassword(email)
      toast.success('Se ha enviado un enlace de recuperación a tu email')
    } catch (error: unknown) {
      console.error('Error sending password reset:', error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al enviar email de recuperación'
      toast.error(message)
      throw error
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      await api.auth.resetPassword(token, password)
      toast.success('Contraseña actualizada exitosamente')
    } catch (error: unknown) {
      console.error('Error resetting password:', error)
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al actualizar contraseña'
      toast.error(message)
      throw error
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user_data')
        
        if (token && userData) {
          try {
            // Verify token is still valid
            const response = await api.auth.getProfile()
            const currentUser = response.data.data.user
            
            localStorage.setItem('user_data', JSON.stringify(currentUser))
            setUser(currentUser)
          } catch (error) {
            // Token is invalid, clean up
            cleanupAuthState()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        cleanupAuthState()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    forgotPassword,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
