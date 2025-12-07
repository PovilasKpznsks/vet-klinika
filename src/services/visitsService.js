import apiClient from './api'

// Vizitų API funkcijos
export const visitsService = {
  // Gauti visus vartotojo vizitus
  async getVisits(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return await apiClient.get(`/visits${queryParams ? `?${queryParams}` : ''}`)
  },

  // Gauti konkretų vizitą
  async getVisit(visitId) {
    return await apiClient.get(`/visits/${visitId}`)
  },

  // Sukurti naują vizitą (registracija)
  async createVisit(visitData) {
    return await apiClient.post('/visits', visitData)
  },

  // Atnaujinti vizitą
  async updateVisit(visitId, visitData) {
    return await apiClient.put(`/visits/${visitId}`, visitData)
  },

  // Atšaukti vizitą
  async cancelVisit(visitId, reason) {
    return await apiClient.patch(`/visits/${visitId}/cancel`, { reason })
  },

  // Gauti būsimus vizitus
  async getUpcomingVisits() {
    return await apiClient.get('/visits/upcoming')
  },

  // Gauti vizitų istoriją
  async getVisitHistory(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return await apiClient.get(`/visits/history${queryParams ? `?${queryParams}` : ''}`)
  },

  // Gauti galimus vizitų laikus
  async getAvailableSlots(doctorId, date) {
    return await apiClient.get(`/visits/available-slots?doctorId=${doctorId}&date=${date}`)
  },

  // Patvirtinti vizitą
  async confirmVisit(visitId) {
    return await apiClient.patch(`/visits/${visitId}/confirm`)
  },

  // Gauti vizito rezultatus/išrašą
  async getVisitResults(visitId) {
    return await apiClient.get(`/visits/${visitId}/results`)
  }
}

export default visitsService