// Pranešimų ir būsenos valdymo servisas
export class NotificationService {
  constructor() {
    this.notifications = []
    this.listeners = []
  }

  // Pridėti klausytoją pranešimų pokyčiams
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  // Informuoti visus klausytojus
  notify() {
    this.listeners.forEach(callback => callback(this.notifications))
  }

  // Pridėti sėkmės pranešimą
  addSuccess(message, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      type: 'success',
      message,
      timestamp: new Date().toISOString(),
      autoClose: options.autoClose !== false,
      duration: options.duration || 5000,
      ...options
    }
    
    this.notifications.push(notification)
    this.notify()

    if (notification.autoClose) {
      setTimeout(() => {
        this.remove(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // Pridėti klaidos pranešimą
  addError(message, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      type: 'error',
      message,
      timestamp: new Date().toISOString(),
      autoClose: options.autoClose !== false,
      duration: options.duration || 8000,
      ...options
    }
    
    this.notifications.push(notification)
    this.notify()

    if (notification.autoClose) {
      setTimeout(() => {
        this.remove(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // Pridėti informacinį pranešimą
  addInfo(message, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      type: 'info',
      message,
      timestamp: new Date().toISOString(),
      autoClose: options.autoClose !== false,
      duration: options.duration || 5000,
      ...options
    }
    
    this.notifications.push(notification)
    this.notify()

    if (notification.autoClose) {
      setTimeout(() => {
        this.remove(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // Pridėti perspėjimo pranešimą
  addWarning(message, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      type: 'warning',
      message,
      timestamp: new Date().toISOString(),
      autoClose: options.autoClose !== false,
      duration: options.duration || 6000,
      ...options
    }
    
    this.notifications.push(notification)
    this.notify()

    if (notification.autoClose) {
      setTimeout(() => {
        this.remove(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // Pašalinti pranešimą
  remove(id) {
    this.notifications = this.notifications.filter(notification => notification.id !== id)
    this.notify()
  }

  // Išvalyti visus pranešimus
  clear() {
    this.notifications = []
    this.notify()
  }

  // Gauti aktyvius pranešimus
  getNotifications() {
    return [...this.notifications]
  }
}

// Būsenos valdymo utility funkcijos
export const StatusUtils = {
  // Analizuoti HTTP atsako būseną
  analyzeResponseStatus(status, data = null) {
    if (status >= 200 && status < 300) {
      return {
        success: true,
        category: 'success',
        message: this.getSuccessMessage(status, data),
        statusCode: status
      }
    } else if (status >= 400 && status < 500) {
      return {
        success: false,
        category: 'client_error',
        message: this.getClientErrorMessage(status, data),
        statusCode: status
      }
    } else if (status >= 500) {
      return {
        success: false,
        category: 'server_error', 
        message: this.getServerErrorMessage(status, data),
        statusCode: status
      }
    } else {
      return {
        success: false,
        category: 'unknown',
        message: 'Nežinoma klaida',
        statusCode: status
      }
    }
  },

  // Sėkmės pranešimai pagal būseną
  getSuccessMessage(status, data = null) {
    switch (status) {
      case 200:
        return 'Operacija sėkmingai atlikta'
      case 201:
        return 'Įrašas sėkmingai sukurtas'
      case 202:
        return 'Užklausa priimta apdorojimui'
      case 204:
        return 'Operacija sėkmingai atlikta'
      default:
        return 'Operacija sėkmingai atlikta'
    }
  },

  // Kliento klaidos pranešimai
  getClientErrorMessage(status, data = null) {
    const errorMessage = data?.message || data?.error
    
    switch (status) {
      case 400:
        return errorMessage || 'Neteisingi užklausos duomenys'
      case 401:
        return errorMessage || 'Reikalingas prisijungimas'
      case 403:
        return errorMessage || 'Neturite teisių atlikti šį veiksmą'
      case 404:
        return errorMessage || 'Ieškomas resursas nerastas'
      case 409:
        return errorMessage || 'Duomenų konfliktas'
      case 422:
        return errorMessage || 'Neteisingi duomenys'
      case 429:
        return errorMessage || 'Per daug užklausų, pabandykite vėliau'
      default:
        return errorMessage || 'Klaida apdorojant užklausą'
    }
  },

  // Serverio klaidos pranešimai
  getServerErrorMessage(status, data = null) {
    const errorMessage = data?.message || data?.error
    
    switch (status) {
      case 500:
        return errorMessage || 'Vidaus serverio klaida'
      case 502:
        return errorMessage || 'Neteisingas serverio atsakas'
      case 503:
        return errorMessage || 'Serveris laikinai nepasiekiamas'
      case 504:
        return errorMessage || 'Serverio atsako laikas baigėsi'
      default:
        return errorMessage || 'Serverio klaida'
    }
  },

  // Veterinarijos specifiniai pranešimai
  getVeterinaryMessage(operation, status, entityType = 'duomenys') {
    const entityNames = {
      'disease': 'liga',
      'visit': 'vizitas',
      'user': 'vartotojas',
      'appointment': 'vizitas',
      'treatment': 'gydymas',
      'prescription': 'receptas',
      'patient': 'pacientas'
    }

    const entityName = entityNames[entityType] || entityType

    if (status === 'success') {
      switch (operation) {
        case 'create':
          return `${entityName} sėkmingai sukurta`
        case 'update':
          return `${entityName} sėkmingai atnaujinta`
        case 'delete':
          return `${entityName} sėkmingai ištrinta`
        case 'fetch':
          return `${entityName} sėkmingai įkelta`
        case 'submit':
          return `${entityName} sėkmingai pateikta`
        default:
          return `Operacija su ${entityName} sėkmingai atlikta`
      }
    } else {
      switch (operation) {
        case 'create':
          return `Nepavyko sukurti ${entityName}`
        case 'update':
          return `Nepavyko atnaujinti ${entityName}`
        case 'delete':
          return `Nepavyko ištrinti ${entityName}`
        case 'fetch':
          return `Nepavyko įkelti ${entityName}`
        case 'submit':
          return `Nepavyko pateikti ${entityName}`
        default:
          return `Operacija su ${entityName} nepavyko`
      }
    }
  }
}

// API funkcijų wrapper'is su automatišku pranešimų valdymu
export const createApiWrapper = (notificationService) => {
  return {
    async executeWithNotification(apiCall, options = {}) {
      const {
        successMessage,
        errorMessage,
        showSuccess = true,
        showError = true,
        operation,
        entityType
      } = options

      try {
        const result = await apiCall()
        
        if (showSuccess) {
          const message = successMessage || 
            StatusUtils.getVeterinaryMessage(operation, 'success', entityType)
          notificationService.addSuccess(message)
        }

        return { success: true, data: result }
      } catch (error) {
        console.error('API call failed:', error)
        
        if (showError) {
          const message = errorMessage || 
            error.message || 
            StatusUtils.getVeterinaryMessage(operation, 'error', entityType)
          notificationService.addError(message)
        }

        return { success: false, error: error.message }
      }
    }
  }
}

// Eksportuoti globalų notification service instance
export const notificationService = new NotificationService()
export const apiWrapper = createApiWrapper(notificationService)

export default notificationService