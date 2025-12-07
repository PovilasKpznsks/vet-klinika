import { useState, useEffect } from 'react'
import diseasesService from '../services/diseasesService'
import '../styles/Diseases.css'

const Diseases = () => {
  const [diseases, setDiseases] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDisease, setSelectedDisease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userDiseases, setUserDiseases] = useState([])

  const categories = [
    { value: 'all', label: 'Visos kategorijos' },
    { value: 'cardiovascular', label: 'Širdies ir kraujagyslių ligos' },
    { value: 'respiratory', label: 'Kvėpavimo sistemos ligos' },
    { value: 'digestive', label: 'Virškinimo sistemos ligos' },
    { value: 'neurological', label: 'Nervų sistemos ligos' },
    { value: 'endocrine', label: 'Endokrininės sistemos ligos' },
    { value: 'infectious', label: 'Infekcinės ligos' },
    { value: 'dermatological', label: 'Odos ligos' },
    { value: 'oncological', label: 'Onkologinės ligos' },
  ]

  useEffect(() => {
    loadDiseases()
    loadUserDiseases()
  }, [])

  const loadDiseases = async () => {
    try {
      setLoading(true)
      const data = await diseasesService.getDiseases().catch(() => getMockDiseases())
      setDiseases(data)
    } catch (error) {
      console.error('Klaida įkeliant ligų duomenis:', error)
      setDiseases(getMockDiseases())
    } finally {
      setLoading(false)
    }
  }

  const loadUserDiseases = async () => {
    try {
      const data = await diseasesService.getUserDiseases().catch(() => [])
      setUserDiseases(data)
    } catch (error) {
      console.error('Klaida įkeliant vartotojo ligų duomenis:', error)
    }
  }

  const getMockDiseases = () => [
    {
      id: 1,
      name: 'Arterinė hipertenzija',
      category: 'cardiovascular',
      description: 'Padidėjęs arterinis kraujospūdis',
      symptoms: ['Galvos skausmas', 'Svaigulys', 'Širdies plakimas'],
      treatment: 'ACE inhibitoriai, diuretikai, gyvenimo būdo keitimas',
      severity: 'moderate',
      prevalence: 'high'
    },
    {
      id: 2,
      name: 'Bronchų astma',
      category: 'respiratory',
      description: 'Lėtinis kvėpavimo takų uždegimas',
      symptoms: ['Dusulys', 'Kosulys', 'Švokštimas'],
      treatment: 'Bronchodilatatoriai, uždegimą mažinantys vaistai',
      severity: 'moderate',
      prevalence: 'medium'
    },
    {
      id: 3,
      name: 'Diabetas',
      category: 'endocrine',
      description: 'Gliukozės metabolizmo sutrikimas',
      symptoms: ['Padažnėjęs šlapinimasis', 'Troškulys', 'Nuovargis'],
      treatment: 'Insulinas, gliukozę mažinantys vaistai, dieta',
      severity: 'high',
      prevalence: 'high'
    },
    {
      id: 4,
      name: 'Gastritas',
      category: 'digestive',
      description: 'Skrandžio gleivinės uždegimas',
      symptoms: ['Skrandžio skausmas', 'Pykinimas', 'Vėmimas'],
      treatment: 'Protonų pompos inhibitoriai, antibiotikai',
      severity: 'low',
      prevalence: 'high'
    },
    {
      id: 5,
      name: 'Migrena',
      category: 'neurological',
      description: 'Lėtinis neurologinis sutrikimas',
      symptoms: ['Intensyvus galvos skausmas', 'Fotofobija', 'Pykinimas'],
      treatment: 'Triptanai, analgetikai, profilaktiniai vaistai',
      severity: 'moderate',
      prevalence: 'medium'
    }
  ]

  const filteredDiseases = diseases.filter(disease => {
    const matchesSearch = disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disease.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || disease.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToUserDiseases = async (disease) => {
    try {
      await diseasesService.addDiseaseRecord({
        diseaseId: disease.id,
        diagnosisDate: new Date().toISOString(),
        status: 'active'
      })
      setUserDiseases([...userDiseases, disease])
      alert('Liga pridėta į jūsų sveikatos istoriją')
    } catch (error) {
      console.error('Klaida pridedant ligą:', error)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return '#28a745'
      case 'moderate': return '#ffc107'
      case 'high': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'low': return 'Lengva'
      case 'moderate': return 'Vidutinė'
      case 'high': return 'Sunki'
      default: return 'Nežinoma'
    }
  }

  if (loading) {
    return (
      <div className="diseases-page">
        <div className="loading-spinner">Kraunami duomenys...</div>
      </div>
    )
  }

  return (
    <div className="diseases-page">
      <div className="diseases-header">
        <h2>Ligų duomenų bazė</h2>
        <p>Ieškokite informacijos apie ligas, jų simptomus ir gydymo metodus</p>
      </div>

      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Ieškoti ligų pagal pavadinimą ar aprašymą..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="diseases-content">
        <div className="diseases-grid">
          {filteredDiseases.map(disease => (
            <div key={disease.id} className="disease-card">
              <div className="disease-header">
                <h3>{disease.name}</h3>
                <span 
                  className="severity-badge"
                  style={{ backgroundColor: getSeverityColor(disease.severity) }}
                >
                  {getSeverityLabel(disease.severity)}
                </span>
              </div>
              
              <p className="disease-description">{disease.description}</p>
              
              <div className="disease-category">
                <span className="category-label">
                  {categories.find(c => c.value === disease.category)?.label}
                </span>
              </div>

              <div className="disease-actions">
                <button 
                  className="btn primary"
                  onClick={() => setSelectedDisease(disease)}
                >
                  Peržiūrėti
                </button>
                <button 
                  className="btn secondary"
                  onClick={() => addToUserDiseases(disease)}
                >
                  Pridėti į istoriją
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDiseases.length === 0 && (
          <div className="no-results">
            <p>Pagal jūsų paieškos kriterijus ligų nerasta.</p>
          </div>
        )}
      </div>

      {userDiseases.length > 0 && (
        <div className="user-diseases-section">
          <h3>Jūsų sveikatos istorija</h3>
          <div className="user-diseases-list">
            {userDiseases.map(disease => (
              <div key={disease.id} className="user-disease-item">
                <span>{disease.name}</span>
                <span className="diagnosis-date">
                  Diagnozė: {new Date().toLocaleDateString('lt-LT')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDisease && (
        <div className="disease-modal-overlay" onClick={() => setSelectedDisease(null)}>
          <div className="disease-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDisease.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedDisease(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="disease-details">
                <div className="detail-section">
                  <h4>Aprašymas</h4>
                  <p>{selectedDisease.description}</p>
                </div>

                <div className="detail-section">
                  <h4>Pagrindiniai simptomai</h4>
                  <ul>
                    {selectedDisease.symptoms?.map((symptom, index) => (
                      <li key={index}>{symptom}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section">
                  <h4>Gydymas</h4>
                  <p>{selectedDisease.treatment}</p>
                </div>

                <div className="disease-meta">
                  <div className="meta-item">
                    <span className="meta-label">Sunkumas:</span>
                    <span 
                      className="meta-value severity"
                      style={{ color: getSeverityColor(selectedDisease.severity) }}
                    >
                      {getSeverityLabel(selectedDisease.severity)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Kategorija:</span>
                    <span className="meta-value">
                      {categories.find(c => c.value === selectedDisease.category)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Diseases