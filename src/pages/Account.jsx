import { useState, useEffect } from 'react'
import userService from '../services/userService'
import { notificationService } from '../services/notificationService'
import '../styles/Account.css'

const Account = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [userData, setUserData] = useState({
    // Asmeninė informacija
    firstName: '',
    lastName: '',
    personalCode: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    
    // Sveikatos duomenys
    bloodType: '',
    allergies: '',
    chronicDiseases: '',
    medications: '',
    emergencyContact: '',
    emergencyPhone: '',
    
    // Sistemos nustatymai
    notifications: true,
    language: 'lt',
    theme: 'light'
  })

  const [healthStats, setHealthStats] = useState({
    totalVisits: 0,
    upcomingVisits: 0,
    activePrescriptions: 0,
    healthAlerts: 0
  })

  // Duomenų įkėlimas iš API
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Naudoti pagerintą userService su automatiniais pranešimais
      const [profileResult, statsResult] = await Promise.all([
        userService.getProfile(false), // Nereikia sėkmės pranešimo įkėlimui
        userService.getHealthStats()
      ])

      if (profileResult.success) {
        setUserData(profileResult.data || getMockUserData())
      } else {
        // Fallback į mock duomenis jei API nepasiekiamas
        setUserData(getMockUserData())
      }

      if (statsResult.success) {
        setHealthStats(statsResult.data || getMockHealthStats())
      } else {
        setHealthStats(getMockHealthStats())
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      notificationService.addError('Nepavyko įkelti vartotojo duomenų')
      
      // Fallback į mock duomenis
      setUserData(getMockUserData())
      setHealthStats(getMockHealthStats())
    } finally {
      setLoading(false)
    }
  }

  // Mock duomenys kaip atsarginė kopija
  const getMockUserData = () => ({
    firstName: 'Jonas',
    lastName: 'Jonaitis',
    personalCode: '38001010000',
    email: 'jonas.jonaitis@email.com',
    phone: '+370 600 00000',
    address: 'Vilniaus g. 1, Vilnius',
    birthDate: '1980-01-01',
    bloodType: 'A+',
    allergies: 'Žiedadulkės',
    chronicDiseases: '',
    medications: '',
    emergencyContact: 'Ona Jonaitienė',
    emergencyPhone: '+370 600 00001',
    notifications: true,
    language: 'lt',
    theme: 'light'
  })

  const getMockHealthStats = () => ({
    totalVisits: 15,
    upcomingVisits: 2,
    activePrescriptions: 1,
    healthAlerts: 0
  })

  const handleSave = async () => {
    try {
      setLoading(true)

      // Naudoti pagerintą userService su automatiniais pranešimais
      const result = await userService.updateProfile(userData)
      
      if (result.success) {
        setIsEditing(false)
        // Pranešimas jau bus parodytas automatiškai per userService
      }
    } catch (error) {
      console.error('Klaida saugant duomenis:', error)
      // Klaidos pranešimas jau bus parodytas automatiškai
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleChangePassword = async () => {
    const currentPassword = prompt('Įveskite dabartinį slaptažodį:')
    if (!currentPassword) return

    const newPassword = prompt('Įveskite naują slaptažodį:')
    if (!newPassword) return

    const confirmPassword = prompt('Pakartokite naują slaptažodį:')
    if (newPassword !== confirmPassword) {
      notificationService.addError('Slaptažodžiai nesutampa')
      return
    }

    const result = await userService.changePassword({
      currentPassword,
      newPassword
    })

    // Pranešimas bus parodytas automatiškai per userService
  }

  const handleDeleteAccount = async () => {
    const result = await userService.deleteAccount()
    
    if (result.success) {
      // Nukreipti į prisijungimo puslapį
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }

  const handleExportData = async () => {
    await userService.exportUserData()
    // Pranešimas bus parodytas automatiškai per userService
  }

  const renderProfileTab = () => (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">
          <span>{userData.firstName.charAt(0)}{userData.lastName.charAt(0)}</span>
        </div>
        <div className="profile-info">
          <h3>{userData.firstName} {userData.lastName}</h3>
          <p>{userData.email}</p>
        </div>
        <button 
          className={`edit-btn ${isEditing ? 'save' : 'edit'}`}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={loading}
        >
          {loading ? 'Kraunama...' : (isEditing ? 'Išsaugoti' : 'Redaguoti')}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="profile-form">
        <div className="form-section">
          <h4>Asmeninė informacija</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Vardas</label>
              <input
                type="text"
                value={userData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Pavardė</label>
              <input
                type="text"
                value={userData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Asmens kodas</label>
              <input
                type="text"
                value={userData.personalCode}
                onChange={(e) => handleInputChange('personalCode', e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Gimimo data</label>
              <input
                type="date"
                value={userData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>El. paštas</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Telefono numeris</label>
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group full-width">
              <label>Adresas</label>
              <input
                type="text"
                value={userData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderHealthTab = () => (
    <div className="health-section">
      <div className="health-stats">
        <div className="stat-card">
          <h4>Vizitai</h4>
          <span className="stat-number">{loading ? '...' : healthStats.totalVisits}</span>
          <p>Iš viso</p>
        </div>
        <div className="stat-card">
          <h4>Būsimi vizitai</h4>
          <span className="stat-number">{loading ? '...' : healthStats.upcomingVisits}</span>
          <p>Suplanuoti</p>
        </div>
        <div className="stat-card">
          <h4>Receptai</h4>
          <span className="stat-number">{loading ? '...' : healthStats.activePrescriptions}</span>
          <p>Aktyvūs</p>
        </div>
        <div className="stat-card">
          <h4>Perspėjimai</h4>
          <span className="stat-number">{loading ? '...' : healthStats.healthAlerts}</span>
          <p>Sveikatos</p>
        </div>
      </div>

      <div className="form-section">
        <h4>Sveikatos duomenys</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Kraujo grupė</label>
            <select
              value={userData.bloodType}
              onChange={(e) => handleInputChange('bloodType', e.target.value)}
              disabled={!isEditing || loading}
            >
              <option value="">Pasirinkite</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div className="form-group">
            <label>Alergijai</label>
            <input
              type="text"
              value={userData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              disabled={!isEditing || loading}
              placeholder="Pvz.: žiedadulkės, vaistai"
            />
          </div>
          <div className="form-group full-width">
            <label>Lėtinės ligos</label>
            <textarea
              value={userData.chronicDiseases}
              onChange={(e) => handleInputChange('chronicDiseases', e.target.value)}
              disabled={!isEditing || loading}
              rows="3"
              placeholder="Aprašykite lėtines ligas ar būkles"
            />
          </div>
          <div className="form-group full-width">
            <label>Nuolat vartojami vaistai</label>
            <textarea
              value={userData.medications}
              onChange={(e) => handleInputChange('medications', e.target.value)}
              disabled={!isEditing || loading}
              rows="3"
              placeholder="Išvardinkite nuolat vartojamuos vaistus"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Skubios pagalbos kontaktai</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Kontaktinio asmens vardas</label>
            <input
              type="text"
              value={userData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              disabled={!isEditing || loading}
            />
          </div>
          <div className="form-group">
            <label>Kontaktinio asmens telefonas</label>
            <input
              type="tel"
              value={userData.emergencyPhone}
              onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
              disabled={!isEditing || loading}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettingsTab = () => (
    <div className="settings-section">
      <div className="form-section">
        <h4>Sistemos nustatymai</h4>
        <div className="settings-grid">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={userData.notifications}
                onChange={(e) => handleInputChange('notifications', e.target.checked)}
                disabled={!isEditing || loading}
              />
              Gauti el. pašto pranešimus
            </label>
          </div>
          <div className="setting-item">
            <label>Kalba</label>
            <select
              value={userData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              disabled={!isEditing || loading}
            >
              <option value="lt">Lietuvių</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Tema</label>
            <select
              value={userData.theme}
              onChange={(e) => handleInputChange('theme', e.target.value)}
              disabled={!isEditing || loading}
            >
              <option value="light">Šviesi</option>
              <option value="dark">Tamsi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Saugumo nustatymai</h4>
        <div className="security-actions">
          <button 
            className="btn secondary" 
            onClick={handleChangePassword}
            disabled={loading}
          >
            Keisti slaptažodį
          </button>
          <button className="btn secondary" disabled={loading}>
            Dviejų veiksnių autentifikacija
          </button>
          <button 
            className="btn secondary" 
            onClick={handleExportData}
            disabled={loading}
          >
            Eksportuoti duomenis
          </button>
          <button 
            className="btn danger" 
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            Ištrinti paskyrą
          </button>
        </div>
      </div>
    </div>
  )

  if (loading && !userData.firstName) {
    return (
      <div className="account-page">
        <div className="loading-spinner">
          <p>Kraunami duomenys...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="account-page">
      <div className="account-header">
        <h2>Paskyros valdymas</h2>
        <p>Tvarkykite savo asmeninę informaciją ir sistemos nustatymus</p>
      </div>

      <div className="account-tabs">
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          disabled={loading}
        >
          Profilis
        </button>
        <button 
          className={`tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
          disabled={loading}
        >
          Sveikatos duomenys
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          disabled={loading}
        >
          Nustatymai
        </button>
      </div>

      <div className="account-content">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  )
}

export default Account