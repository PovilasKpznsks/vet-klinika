import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'
import { notificationService } from '../services/notificationService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize authentication state on app load
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setLoading(true)
      
      // Check if there's a stored token
      const token = authService.getToken()
      
      if (token) {
        // Gauti vartotojo duomenis iš localStorage (mock režime)
        const userData = authService.getUserData()
        
        if (userData) {
          setUser(userData)
          setIsAuthenticated(true)
        } else {
          // TODO: Verify token with backend and get user data
          // For now, we'll use mock data if token exists
          const mockUser = {
            id: 1,
            firstName: 'Jonas',
            lastName: 'Jonaitis',
            email: 'jonas.jonaitis@email.com',
            phone: '+370 600 00000',
            personalCode: '38001010000'
          }
          
          setUser(mockUser)
          setIsAuthenticated(true)
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      // Clear invalid token
      authService.logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const result = await authService.login(credentials)
      
      if (result.token) {
        // Naudoti tikrus vartotojo duomenis iš authService
        const userData = result.user
        
        setUser(userData)
        setIsAuthenticated(true)
        
        return { success: true, user: userData }
      }
      
      throw new Error('Login failed')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const result = await authService.register(userData)
      
      if (result.token) {
        // Auto-login after successful registration
        const newUser = result.user
        
        setUser(newUser)
        setIsAuthenticated(true)
        
        return { success: true, user: newUser }
      }
      
      throw new Error('Registration failed')
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      notificationService.addInfo('Sėkmingai atsijungėte')
    }
  }

  const updateUser = (updatedUserData) => {
    setUser(prev => ({
      ...prev,
      ...updatedUserData
    }))
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    initializeAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext