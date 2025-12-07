import apiClient from './api'
import { apiWrapper, notificationService } from './notificationService'

// Vartotojo API funkcijos su pagerintu pranešimų valdymu
export const userService = {
  // Gauti vartotojo profilį su pranešimais
  async getProfile(showNotifications = false) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.get('/user/profile'),
      {
        operation: 'fetch',
        entityType: 'user',
        showSuccess: showNotifications,
        showError: true,
        successMessage: showNotifications ? 'Profilio duomenys sėkmingai įkelti' : null
      }
    )
  },

  // Atnaujinti vartotojo profilį
  async updateProfile(userData) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.put('/user/profile', userData),
      {
        operation: 'update',
        entityType: 'user',
        showSuccess: true,
        showError: true,
        successMessage: 'Profilio duomenys sėkmingai atnaujinti'
      }
    )
  },

  // Gauti vartotojo sveikatos statistikas
  async getHealthStats() {
    return await apiWrapper.executeWithNotification(
      () => apiClient.get('/user/health-stats'),
      {
        operation: 'fetch',
        entityType: 'duomenys',
        showSuccess: false,
        showError: true,
        errorMessage: 'Nepavyko įkelti sveikatos statistikos'
      }
    )
  },

  // Atnaujinti sveikatos duomenis
  async updateHealthData(healthData) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.patch('/user/health-data', healthData),
      {
        operation: 'update',
        entityType: 'duomenys',
        showSuccess: true,
        showError: true,
        successMessage: 'Sveikatos duomenys sėkmingai atnaujinti'
      }
    )
  },

  // Keisti slaptažodį
  async changePassword(passwordData) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.post('/user/change-password', passwordData),
      {
        operation: 'update',
        entityType: 'slaptažodis',
        showSuccess: true,
        showError: true,
        successMessage: 'Slaptažodis sėkmingai pakeistas'
      }
    )
  },

  // Atnaujinti nustatymus
  async updateSettings(settings) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.patch('/user/settings', settings),
      {
        operation: 'update',
        entityType: 'nustatymai',
        showSuccess: true,
        showError: true,
        successMessage: 'Nustatymai sėkmingai atnaujinti'
      }
    )
  },

  // Ištrinti paskyrą su patvirtinimu
  async deleteAccount() {
    const confirmed = window.confirm(
      'Ar tikrai norite ištrinti savo paskyrą? Šis veiksmas neatšaukiamas.'
    )
    
    if (!confirmed) {
      notificationService.addInfo('Paskyros trynimas atšauktas')
      return { success: false, cancelled: true }
    }

    return await apiWrapper.executeWithNotification(
      () => apiClient.delete('/user/account'),
      {
        operation: 'delete',
        entityType: 'paskyra',
        showSuccess: true,
        showError: true,
        successMessage: 'Paskyra sėkmingai ištrinta'
      }
    )
  },

  // Gauti prisijungimo istoriją
  async getLoginHistory() {
    return await apiWrapper.executeWithNotification(
      () => apiClient.get('/user/login-history'),
      {
        operation: 'fetch',
        entityType: 'duomenys',
        showSuccess: false,
        showError: true,
        errorMessage: 'Nepavyko įkelti prisijungimo istorijos'
      }
    )
  },

  // Atsijungti iš visų įrenginių
  async logoutAllDevices() {
    return await apiWrapper.executeWithNotification(
      () => apiClient.post('/user/logout-all'),
      {
        operation: 'update',
        entityType: 'sesija',
        showSuccess: true,
        showError: true,
        successMessage: 'Sėkmingai atsijungta iš visų įrenginių'
      }
    )
  },

  // Eksportuoti vartotojo duomenis (GDPR)
  async exportUserData() {
    notificationService.addInfo('Pradedamas duomenų eksportavimas...')
    
    return await apiWrapper.executeWithNotification(
      () => apiClient.get('/user/export-data'),
      {
        operation: 'fetch',
        entityType: 'duomenys',
        showSuccess: true,
        showError: true,
        successMessage: 'Duomenų eksportavimas sėkmingai pradėtas. Gausite el. laišką su atsisiuntimo nuoroda.'
      }
    )
  }
}

export default userService