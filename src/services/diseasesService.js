import apiClient from './api'

// Ligų ir sveikatos duomenų API funkcijos
export const diseasesService = {
  // Gauti visas ligas
  async getDiseases(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    const url = `http://localhost:5068/api/Disease${queryParams ? `?${queryParams}` : ''}`
    const resp = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
    if (!resp.ok) {
      const err = await resp.text().catch(() => '')
      throw new Error(`Failed to fetch diseases: ${resp.status} ${err}`)
    }
    return await resp.json()
  },

  // Gauti konkretų ligos įrašą
  async getDisease(diseaseId) {
    return await apiClient.get(`/Disease/${diseaseId}`)
  },

  // Gauti vartotojo ligų istoriją
  async getUserDiseases() {
    return await apiClient.get('/Disease/user-history')
  },

  // Pridėti naują ligos įrašą
  async addDiseaseRecord(diseaseData) {
    return await apiClient.post('/Disease', diseaseData)
  },

  // Atnaujinti ligos įrašą
  async updateDiseaseRecord(diseaseId, diseaseData) {
    return await apiClient.put(`/Disease/${diseaseId}`, diseaseData)
  },

  // Ištrinti ligos įrašą
  async deleteDiseaseRecord(diseaseId) {
    return await apiClient.delete(`/Disease/${diseaseId}`)
  },

  // Gauti ligas pagal kategoriją
  async getDiseasesByCategory(category) {
    // Fetch all diseases and filter client-side.
    // Accepts: enum name ("Infection"), localized label with parentheses ("Infekcija (Infection)"),
    // or numeric value (0, "0"). Comparison is case-insensitive.
    const diseases = await this.getDiseases()
    if (category === undefined || category === null || category === '') return diseases

    const normalizeInput = (c) => {
      if (typeof c === 'number') return { kind: 'number', value: c }
      const s = String(c).trim()
      // if label contains parentheses like "Infekcija (Infection)", prefer inner value
      const paren = s.match(/\(([^)]+)\)/)
      const extracted = paren ? paren[1].trim() : s
      if (/^\d+$/.test(extracted)) return { kind: 'number', value: Number(extracted) }
      return { kind: 'string', value: extracted.toLowerCase() }
    }

    const input = normalizeInput(category)

    return diseases.filter(d => {
      const raw = d.category ?? d.Category ?? ''
      if (input.kind === 'number') {
        if (typeof raw === 'number') return raw === input.value
        if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw) === input.value
        return false
      }

      // string comparison (case-insensitive)
      const rawStr = String(raw).toLowerCase()
      return rawStr === input.value
    })
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
  },

  // Rasti ligas pagal simptomus
  async findDiseasesBySymptoms(symptoms) {
    return await apiClient.post('/disease/find-by-symptoms', { symptoms })
  }
}

export default diseasesService