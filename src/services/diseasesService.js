import apiClient from './api'

// Ligų ir sveikatos duomenų API funkcijos
export const diseasesService = {
  // Gauti visas ligas
  async getDiseases(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return await apiClient.get(`/diseases${queryParams ? `?${queryParams}` : ''}`)
  },

  // Gauti konkretų ligos įrašą
  async getDisease(diseaseId) {
    return await apiClient.get(`/diseases/${diseaseId}`)
  },

  // Gauti vartotojo ligų istoriją
  async getUserDiseases() {
    return await apiClient.get('/diseases/user-history')
  },

  // Pridėti naują ligos įrašą
  async addDiseaseRecord(diseaseData) {
    return await apiClient.post('/diseases', diseaseData)
  },

  // Atnaujinti ligos įrašą
  async updateDiseaseRecord(diseaseId, diseaseData) {
    return await apiClient.put(`/diseases/${diseaseId}`, diseaseData)
  },

  // Ištrinti ligos įrašą
  async deleteDiseaseRecord(diseaseId) {
    return await apiClient.delete(`/diseases/${diseaseId}`)
  },

  // Gauti ligas pagal kategoriją
  async getDiseasesByCategory(category) {
    return await apiClient.get(`/diseases/category/${category}`)
  },

  // Ieškoti ligų pagal pavadinimą
  async searchDiseases(searchTerm) {
    return await apiClient.get(`/diseases/search?q=${encodeURIComponent(searchTerm)}`)
  },

  // Gauti dažniausias ligas
  async getCommonDiseases() {
    return await apiClient.get('/diseases/common')
  },

  // Gauti ligos simptomų informaciją
  async getDiseaseSymptoms(diseaseId) {
    return await apiClient.get(`/diseases/${diseaseId}/symptoms`)
  },

  // Gauti ligos gydymo informaciją
  async getDiseaseTreatment(diseaseId) {
    return await apiClient.get(`/diseases/${diseaseId}/treatment`)
  }
}

export default diseasesService