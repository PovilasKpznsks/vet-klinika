import apiClient from './api'

// Role types matching backend enum
const ROLE_TYPES = {
  Administrator: 0,
  Veterinarian: 1,
  Client: 2
}

// Laikini testavimo duomenys (kai backend'as neveikia)
const MOCK_USERS = [
  {
    id: 1,
    firstName: 'Admin',
    lastName: 'Administratorius',
    email: 'admin@email.com',
    phone: '+370 600 00000',
    personalCode: '37001010000',
    password: 'admin123',
    role: ROLE_TYPES.Administrator
  },
  {
    id: 2,
    firstName: 'Jonas',
    lastName: 'Jonaitis',
    email: 'jonas@email.com',
    phone: '+370 600 00001',
    personalCode: '38001010000',
    password: '123456',
    role: ROLE_TYPES.Client
  },
  {
    id: 3,
    firstName: 'Petras',
    lastName: 'Petraitis', 
    email: 'petras@email.com',
    phone: '+370 600 00002',
    personalCode: '39001010000',
    password: 'Slaptazodis1',
    role: ROLE_TYPES.Veterinarian
  }
]

// Patikrinti ar naudoti mock režimą (kai backend'as nepasiekiamas)
// Set to false to use real backend endpoints.
const USE_MOCK_AUTH = false

// Autentifikacijos API funkcijos
export const authService = {
  // Prisijungimas
  async login(credentials) {
    if (USE_MOCK_AUTH) {
      // Mock prisijungimas testuojant be backend'o
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const user = MOCK_USERS.find(u => 
            u.email === credentials.email && u.password === credentials.password
          )
          
          if (user) {
            const token = `mock_token_${user.id}_${Date.now()}`
            localStorage.setItem('auth_token', token)
            localStorage.setItem('user_data', JSON.stringify(user))
            
            resolve({
              token,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                personalCode: user.personalCode,
                role: user.role
              }
            })
          } else {
            reject(new Error('Neteisingas el. paštas arba slaptažodis'))
          }
        }, 500) // Simuliuojame serverio atsaką
      })
    }
    
    // Real API flow
    try {
      const response = await apiClient.post('/auth/login', credentials)

      // Try multiple possible token property names
      const token = response?.AccessToken || response?.accessToken || response?.token || response?.Token || response?.access_token

      if (token) {
        apiClient.setAuthToken(token)
        // Persist token in both keys for compatibility
        localStorage.setItem('auth_token', token)
        localStorage.setItem('authToken', token)

        // Get full user profile
        try {
          const me = await apiClient.get('/users/me')
          const user = me || {
            id: response?.UserId,
            email: response?.Email,
            role: isNaN(Number(response?.Role)) ? response?.Role : Number(response?.Role)
          }
          localStorage.setItem('user_data', JSON.stringify(user))
          return { token, user }
        } catch (err) {
          const user = { id: response?.UserId, email: response?.Email, role: response?.Role }
          localStorage.setItem('user_data', JSON.stringify(user))
          return { token, user }
        }
      }

      // No token in response - surface server message
      const serverMsg = response?.message || response?.error || response?.Message || null
      throw new Error(serverMsg || 'Login failed')
    } catch (err) {
      console.error('authService.login error', err)
      throw err
    }
  },

  // Registracija
  async register(userData) {
    if (USE_MOCK_AUTH) {
      // Mock registracija testuojant be backend'o
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Patikrinti ar toks el. paštas jau egzistuoja
          const existingUser = MOCK_USERS.find(u => u.email === userData.email)
          if (existingUser) {
            reject(new Error('Vartotojas su tokiu el. paštu jau egzistuoja'))
            return
          }
          
          // Sukurti naują vartotoją
          const newUser = {
            id: Date.now(),
            ...userData
          }
          
          MOCK_USERS.push(newUser)
          
          const token = `mock_token_${newUser.id}_${Date.now()}`
          localStorage.setItem('auth_token', token)
          localStorage.setItem('authToken', token)
          localStorage.setItem('user_data', JSON.stringify(newUser))
          
          resolve({
            token,
            user: newUser
          })
        }, 800) // Simuliuojame ilgesnį serverio atsaką registracijai
      })
    }
    
    // Real API flow
    try {
      const response = await apiClient.post('/auth/register', userData)
      const token = response?.AccessToken || response?.accessToken || response?.token || response?.Token || response?.access_token

      if (token) {
        // Do NOT store token or authenticate user
        // User must login manually after registration
        return { token, success: true }
      }

      const serverMsg = response?.message || response?.error || response?.Message || null
      throw new Error(serverMsg || 'Registration failed')
    } catch (err) {
      console.error('authService.register error', err)
      throw err
    }
  },

  // Atsijungimas
  async logout() {
    if (USE_MOCK_AUTH) {
      // Mock atsijungimas
      localStorage.removeItem('auth_token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('user_data')
      return Promise.resolve()
    }
    
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all auth tokens and user data from localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('user_data')
      apiClient.setAuthToken(null)
    }
  },

  // Slaptažodžio atstatymas
  async requestPasswordReset(email) {
    if (USE_MOCK_AUTH) {
      // Mock slaptažodžio atstatymas
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const user = MOCK_USERS.find(u => u.email === email)
          if (user) {
            resolve({ message: 'Slaptažodžio atkūrimo instrukcijos išsiųstos' })
          } else {
            reject(new Error('Vartotojas su tokiu el. paštu nerastas'))
          }
        }, 1000)
      })
    }
    
    return await apiClient.post('/auth/forgot-password', { email })
  },

  // Slaptažodžio atstatymo patvirtinimas
  async resetPassword(token, newPassword) {
    return await apiClient.post('/auth/reset-password', {
      token,
      password: newPassword
    })
  },

  // El. pašto patvirtinimas
  async verifyEmail(token) {
    return await apiClient.post('/auth/verify-email', { token })
  },

  // Pakartotinio el. pašto siuntimas
  async resendVerificationEmail() {
    return await apiClient.post('/auth/resend-verification')
  },

  // Patikrinti ar vartotojas prisijungęs
  isAuthenticated() {
    // Check both client token and legacy localStorage key for compatibility
    return !!(apiClient.token || localStorage.getItem('authToken') || localStorage.getItem('auth_token'))
  },

  // Gauti dabartinį tokeną
  getToken() {
    return apiClient.token || localStorage.getItem('authToken') || localStorage.getItem('auth_token')
  },

  // Gauti vartotojo duomenis iš localStorage (mock režime)
  getUserData() {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  },

  // Atnaujinti tokeną
  async refreshToken() {
    const response = await apiClient.post('/auth/refresh-token')
    if (response.token) {
      apiClient.setAuthToken(response.token)
    }
    return response
  }
}

export default authService