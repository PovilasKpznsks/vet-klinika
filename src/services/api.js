// API konfigūracija ir bazinis HTTP klientas
import { StatusUtils } from './notificationService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5068/api'

// HTTP klientas su baziniais nustatymais
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('authToken')
  }

  // Nustatyti autentifikacijos tokeną
  setAuthToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
  }

  // Gauti autentifikacijos antraštes
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    return headers
  }

  // Bazinis HTTP užklausos metodas su pagerintomis klaidomis
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      // Patikrinti ar užklausa sėkminga
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Naudoti StatusUtils geresniam klaidos apdorojimui
        const statusInfo = StatusUtils.analyzeResponseStatus(response.status, errorData)
        
        const error = new Error(statusInfo.message)
        error.status = response.status
        error.statusInfo = statusInfo
        error.data = errorData
        
        throw error
      }

      // Grąžinti JSON duomenis jei yra
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        
        // Pridėti sėkmės informaciją
        const statusInfo = StatusUtils.analyzeResponseStatus(response.status, data)
        
        // If data is an array, don't spread it (would turn into object with numeric keys)
        if (Array.isArray(data)) {
          return data
        }
        
        return {
          ...data,
          _statusInfo: statusInfo
        }
      }

      return response
    } catch (error) {
      // Jei klaida nėra HTTP klaida (pvz., tinklo problema)
      if (!error.status) {
        const networkError = new Error('Tinklo klaida arba serveris nepasiekiamas')
        networkError.status = 0
        networkError.statusInfo = {
          success: false,
          category: 'network_error',
          message: 'Tinklo klaida arba serveris nepasiekiamas'
        }
        
        console.error(`Network error for ${url}:`, error)
        throw networkError
      }
      
      console.error(`API Request failed: ${url}`, error)
      throw error
    }
  }

  // GET užklausa
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  // POST užklausa
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT užklausa
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // PATCH užklausa
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // DELETE užklausa
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    })
  }

  // Patikrinti serverio būseną
  async healthCheck() {
    try {
      const response = await this.get('/health')
      return {
        success: true,
        status: 'healthy',
        data: response
      }
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      }
    }
  }

  // Gauti API versijos informaciją
  async getApiInfo() {
    try {
      return await this.get('/info')
    } catch (error) {
      console.warn('Could not fetch API info:', error)
      return {
        version: 'unknown',
        name: 'Veterinary Clinic API'
      }
    }
  }
}

// Eksportuoti API klientą
export const apiClient = new ApiClient()
export default apiClient