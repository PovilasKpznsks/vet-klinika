import apiClient from './api'

// Autentifikacijos API funkcijos
export const authService = {
  // Prisijungimas
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials)
    if (response.token) {
      apiClient.setAuthToken(response.token)
    }
    return response
  },

  // Registracija
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData)
    if (response.token) {
      apiClient.setAuthToken(response.token)
    }
    return response
  },

  // Atsijungimas
  async logout() {
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
    return !!apiClient.token
  },

  // Gauti dabartinį tokeną
  getToken() {
    return apiClient.token
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