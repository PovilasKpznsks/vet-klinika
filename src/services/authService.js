import apiClient from './api'

// Laikini testavimo duomenys (kai backend'as neveikia)
const MOCK_USERS = [
  {
    id: 1,
    firstName: 'Jonas',
    lastName: 'Jonaitis',
    email: 'jonas@email.com',
    phone: '+370 600 00001',
    personalCode: '38001010000',
    password: '123456'
  },
  {
    id: 2,
    firstName: 'Petras',
    lastName: 'Petraitis', 
    email: 'petras@email.com',
    phone: '+370 600 00002',
    personalCode: '39001010000',
    password: 'Slaptazodis1'
  }
]

// Patikrinti ar naudoti mock režimą (kai backend'as nepasiekiamas)
const USE_MOCK_AUTH = true // Pakeiskite į false, kai backend'as veiks

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
                personalCode: user.personalCode
              }
            })
          } else {
            reject(new Error('Neteisingas el. paštas arba slaptažodis'))
          }
        }, 500) // Simuliuojame serverio atsaką
      })
    }
    
    // Tikras API kvietimas (kai backend'as veikia)
    const response = await apiClient.post('/auth/login', credentials)
    if (response.token) {
      apiClient.setAuthToken(response.token)
    }
    return response
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
          localStorage.setItem('user_data', JSON.stringify(newUser))
          
          resolve({
            token,
            user: newUser
          })
        }, 800) // Simuliuojame ilgesnį serverio atsaką registracijai
      })
    }
    
    // Tikras API kvietimas
    const response = await apiClient.post('/auth/register', userData)
    if (response.token) {
      apiClient.setAuthToken(response.token)
    }
    return response
  },

  // Atsijungimas
  async logout() {
    if (USE_MOCK_AUTH) {
      // Mock atsijungimas
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      return Promise.resolve()
    }
    
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
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
    if (USE_MOCK_AUTH) {
      return !!localStorage.getItem('auth_token')
    }
    return !!apiClient.token
  },

  // Gauti dabartinį tokeną
  getToken() {
    if (USE_MOCK_AUTH) {
      return localStorage.getItem('auth_token')
    }
    return apiClient.token
  },

  // Gauti vartotojo duomenis iš localStorage (mock režime)
  getUserData() {
    if (USE_MOCK_AUTH) {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    }
    return null
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