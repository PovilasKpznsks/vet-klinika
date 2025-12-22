import apiClient from './api'

// Vizitų API funkcijos
export const visitsService = {
  // Gauti visus vizitus (admin)
  async getVisits(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return await apiClient.get(`/visit${queryParams ? `?${queryParams}` : ''}`)
  },

  // Gauti vartotojo vizitus (client)
  async getClientVisits(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return await apiClient.get(`/visit/client${queryParams ? `?${queryParams}` : ''}`)
  },

  // Gauti veterinaro vizitus (veterinarian)
  async getVeterinarianVisits(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return await apiClient.get(`/visit/veterinarian${queryParams ? `?${queryParams}` : ''}`)
  },

  // Gauti konkretų vizitą
  async getVisit(visitId) {
    return await apiClient.get(`/visits/${visitId}`)
  },

  // Sukurti naują vizitą (registracija)
  async createVisit(visitData) {
    return await apiClient.post('/visit', visitData)
  },

  // Atnaujinti vizitą
  async updateVisit(visitId, visitData) {
    return await apiClient.put('/visit', visitData)
  },

  // Atšaukti vizitą
  async cancelVisit(visitId) {
    return await apiClient.post(`/visit/cancel`, { id: visitId })
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
  },

  // Gauti veterinaro darbo valandas
  async getWorkday(veterinarianId) {
    return await apiClient.get(`/visit/workday?VeterinarianId=${veterinarianId}`)
  },

  // Sukurti veterinaro darbo dieną
  async createWorkday(workdayData) {
    return await apiClient.post('/visit/workday', workdayData)
  },

  // Ištrinti veterinaro darbo dieną
  async deleteWorkday(veterinarianId, date) {
    return await apiClient.delete(`/visit/workday?VeterinarianId=${veterinarianId}&Date=${date}`)
  }
}

export default visitsService