import apiClient from './api'
import { apiWrapper } from './notificationService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5068/api'

export const veterinariansService = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await apiWrapper.executeWithNotification(
      () => apiClient.get(`/Veterinarian${query ? `?${query}` : ''}`),
      { operation: 'fetch', entityType: 'veterinarai', showSuccess: false, showError: true }
    )
    // Extract data from wrapper response
    return response?.data || response || []
  },
  async getById(id) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.get(`/Veterinarian/${id}`),
      { operation: 'fetch', entityType: 'veterinaras', showSuccess: false, showError: true }
    )
  },
  async create(data) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.post('/Veterinarian', data),
      { operation: 'create', entityType: 'veterinaras', showSuccess: true, showError: true, successMessage: 'Veterinaras pridėtas' }
    )
  },
  async update(id, data) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.put(`/Veterinarian/${id}`, data),
      { operation: 'update', entityType: 'veterinaras', showSuccess: true, showError: true, successMessage: 'Veterinaro duomenys atnaujinti' }
    )
  },
  async remove(id) {
    return await apiWrapper.executeWithNotification(
      () => apiClient.delete(`/Veterinarian/${id}`),
      { operation: 'delete', entityType: 'veterinaras', showSuccess: true, showError: true, successMessage: 'Veterinaras pašalintas' }
    )
  },
  async downloadExcel() {
    try {
      const response = await fetch(`${API_BASE_URL}/Veterinarian/excel`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      if (!response.ok) throw new Error('Failed to download Excel')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'veterinarians.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading Excel:', error)
      throw error
    }
  }
}

export default veterinariansService
