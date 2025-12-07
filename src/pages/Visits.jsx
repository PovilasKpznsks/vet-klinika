import { useState, useEffect } from 'react'
import visitsService from '../services/visitsService'
import '../styles/Visits.css'

const Visits = () => {
  const [visits, setVisits] = useState([])
  const [showNewVisitForm, setShowNewVisitForm] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [newVisit, setNewVisit] = useState({
    doctorName: '',
    specialty: '',
    date: '',
    time: '',
    reason: '',
    symptoms: '',
    notes: '',
    type: 'consultation'
  })

  const specialties = [
    'Šeimos gydytojas',
    'Kardiologas',
    'Neurologas',
    'Dermatologas',
    'Oftalmologas',
    'Ortopedas',
    'Ginekologas',
    'Pediatras',
    'Psichiatras',
    'Endokrinologas'
  ]

  const visitTypes = [
    { value: 'consultation', label: 'Konsultacija' },
    { value: 'examination', label: 'Tyrimas' },
    { value: 'procedure', label: 'Procedūra' },
    { value: 'surgery', label: 'Operacija' },
    { value: 'followup', label: 'Pakartotinis vizitas' }
  ]

  useEffect(() => {
    loadVisits()
  }, [])

  const loadVisits = async () => {
    try {
      setLoading(true)
      const data = await visitsService.getVisits().catch(() => getMockVisits())
      setVisits(data)
    } catch (error) {
      console.error('Klaida įkeliant vizitų duomenis:', error)
      setVisits(getMockVisits())
    } finally {
      setLoading(false)
    }
  }

  const getMockVisits = () => [
    {
      id: 1,
      doctorName: 'Dr. Petras Petraitis',
      specialty: 'Šeimos gydytojas',
      date: '2024-01-15',
      time: '14:30',
      reason: 'Profilaktinis patikrinimas',
      symptoms: 'Bendras nuovargis, galvos skausmai',
      diagnosis: 'Arterinė hipertenzija',
      treatment: 'Paskirti vaistai nuo spaudimo, dietos rekomendacijos',
      status: 'completed',
      type: 'consultation',
      notes: 'Rekomenduojama pakartoti vizitą po mėnesio',
      createdAt: '2024-01-15T14:30:00Z'
    },
    {
      id: 2,
      doctorName: 'Dr. Ana Kazlienė',
      specialty: 'Kardiologas',
      date: '2024-02-03',
      time: '10:15',
      reason: 'Širdies ritmo sutrikimai',
      symptoms: 'Širdies plakimas, dusulys',
      diagnosis: 'Širdies aritmija',
      treatment: 'EKG tyrimas, beta-blokatorių skyrimas',
      status: 'completed',
      type: 'examination',
      notes: 'Reikalingas kardiologinis stebėjimas',
      createdAt: '2024-02-03T10:15:00Z'
    },
    {
      id: 3,
      doctorName: 'Dr. Jonas Jonaitis',
      specialty: 'Dermatologas',
      date: '2024-12-20',
      time: '16:00',
      reason: 'Odos bėrimų tyrimas',
      symptoms: 'Niežulys, raudonos dėmės',
      status: 'scheduled',
      type: 'consultation',
      notes: 'Būtina atsinešti ankstesnių tyrimų rezultatus',
      createdAt: '2024-12-06T12:00:00Z'
    }
  ]

  const handleNewVisitSubmit = async (e) => {
    e.preventDefault()
    try {
      const visitData = {
        ...newVisit,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      }
      
      await visitsService.createVisit(visitData).catch(() => {
        // Mock pridėjimas
        const mockVisit = {
          ...visitData,
          id: visits.length + 1
        }
        setVisits([...visits, mockVisit])
      })
      
      setNewVisit({
        doctorName: '',
        specialty: '',
        date: '',
        time: '',
        reason: '',
        symptoms: '',
        notes: '',
        type: 'consultation'
      })
      setShowNewVisitForm(false)
      alert('Vizitas sėkmingai užregistruotas!')
    } catch (error) {
      console.error('Klaida registruojant vizitą:', error)
      alert('Klaida registruojant vizitą')
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled': return 'Suplanuotas'
      case 'completed': return 'Įvykęs'
      case 'cancelled': return 'Atšauktas'
      default: return 'Nežinoma'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#17a2b8'
      case 'completed': return '#28a745'
      case 'cancelled': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getTypeLabel = (type) => {
    return visitTypes.find(t => t.value === type)?.label || type
  }

  const filteredVisits = visits
    .filter(visit => filterStatus === 'all' || visit.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date) - new Date(a.date)
      }
      return a[sortBy]?.localeCompare(b[sortBy]) || 0
    })

  const cancelVisit = async (visitId) => {
    if (window.confirm('Ar tikrai norite atšaukti šį vizitą?')) {
      try {
        await visitsService.cancelVisit(visitId).catch(() => {
          // Mock atnaujinimas
          setVisits(visits.map(visit => 
            visit.id === visitId ? { ...visit, status: 'cancelled' } : visit
          ))
        })
        alert('Vizitas sėkmingai atšauktas')
      } catch (error) {
        console.error('Klaida atšaukiant vizitą:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="visits-page">
        <div className="loading-spinner">Kraunami duomenys...</div>
      </div>
    )
  }

  return (
    <div className="visits-page">
      <div className="visits-header">
        <h2>Vizitai pas gydytojus</h2>
        <p>Registruokite vizitus ir peržiūrėkite savo sveikatos istoriją</p>
      </div>

      <div className="visits-actions">
        <button 
          className="btn primary"
          onClick={() => setShowNewVisitForm(true)}
        >
          + Registruoti naują vizitą
        </button>
        
        <div className="visits-filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Visi vizitai</option>
            <option value="scheduled">Suplanuoti</option>
            <option value="completed">Įvykę</option>
            <option value="cancelled">Atšaukti</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Rūšiuoti pagal datą</option>
            <option value="doctorName">Rūšiuoti pagal gydytoją</option>
            <option value="specialty">Rūšiuoti pagal sritį</option>
          </select>
        </div>
      </div>

      <div className="visits-list">
        {filteredVisits.length === 0 ? (
          <div className="no-visits">
            <p>Vizitų nerasta.</p>
          </div>
        ) : (
          filteredVisits.map(visit => (
            <div key={visit.id} className="visit-card">
              <div className="visit-main-info">
                <div className="visit-header">
                  <h3>{visit.doctorName}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(visit.status) }}
                  >
                    {getStatusLabel(visit.status)}
                  </span>
                </div>
                
                <div className="visit-details">
                  <div className="detail-row">
                    <span className="label">Sritis:</span>
                    <span>{visit.specialty}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Data:</span>
                    <span>{new Date(visit.date).toLocaleDateString('lt-LT')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Laikas:</span>
                    <span>{visit.time}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tipas:</span>
                    <span>{getTypeLabel(visit.type)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Priežastis:</span>
                    <span>{visit.reason}</span>
                  </div>
                </div>
              </div>

              <div className="visit-actions">
                <button 
                  className="btn secondary"
                  onClick={() => setSelectedVisit(visit)}
                >
                  Peržiūrėti
                </button>
                {visit.status === 'scheduled' && (
                  <button 
                    className="btn danger"
                    onClick={() => cancelVisit(visit.id)}
                  >
                    Atšaukti
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Naujo vizito forma */}
      {showNewVisitForm && (
        <div className="modal-overlay" onClick={() => setShowNewVisitForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registruoti naują vizitą</h3>
              <button 
                className="close-btn"
                onClick={() => setShowNewVisitForm(false)}
              >
                ×
              </button>
            </div>
            
            <form className="visit-form" onSubmit={handleNewVisitSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Gydytojo vardas*</label>
                  <input
                    type="text"
                    required
                    value={newVisit.doctorName}
                    onChange={(e) => setNewVisit({...newVisit, doctorName: e.target.value})}
                    placeholder="Įveskite gydytojo vardą"
                  />
                </div>
                
                <div className="form-group">
                  <label>Specializacija*</label>
                  <select
                    required
                    value={newVisit.specialty}
                    onChange={(e) => setNewVisit({...newVisit, specialty: e.target.value})}
                  >
                    <option value="">Pasirinkite specializaciją</option>
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data*</label>
                  <input
                    type="date"
                    required
                    value={newVisit.date}
                    onChange={(e) => setNewVisit({...newVisit, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label>Laikas*</label>
                  <input
                    type="time"
                    required
                    value={newVisit.time}
                    onChange={(e) => setNewVisit({...newVisit, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Vizito tipas*</label>
                <select
                  required
                  value={newVisit.type}
                  onChange={(e) => setNewVisit({...newVisit, type: e.target.value})}
                >
                  {visitTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vizito priežastis*</label>
                <textarea
                  required
                  value={newVisit.reason}
                  onChange={(e) => setNewVisit({...newVisit, reason: e.target.value})}
                  placeholder="Aprašykite vizito priežastį"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Simptomai</label>
                <textarea
                  value={newVisit.symptoms}
                  onChange={(e) => setNewVisit({...newVisit, symptoms: e.target.value})}
                  placeholder="Aprašykite simptomus (neprivaloma)"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Papildomi komentarai</label>
                <textarea
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({...newVisit, notes: e.target.value})}
                  placeholder="Papildoma informacija (neprivaloma)"
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setShowNewVisitForm(false)}>
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  Registruoti vizitą
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vizito peržiūros modalas */}
      {selectedVisit && (
        <div className="modal-overlay" onClick={() => setSelectedVisit(null)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Vizito informacija</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedVisit(null)}
              >
                ×
              </button>
            </div>
            
            <div className="visit-details-modal">
              <div className="detail-section">
                <h4>Pagrindinė informacija</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Gydytojas:</span>
                    <span>{selectedVisit.doctorName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Specializacija:</span>
                    <span>{selectedVisit.specialty}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Data:</span>
                    <span>{new Date(selectedVisit.date).toLocaleDateString('lt-LT')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Laikas:</span>
                    <span>{selectedVisit.time}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Tipas:</span>
                    <span>{getTypeLabel(selectedVisit.type)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Būsena:</span>
                    <span 
                      style={{ 
                        color: getStatusColor(selectedVisit.status),
                        fontWeight: 'bold'
                      }}
                    >
                      {getStatusLabel(selectedVisit.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Vizito priežastis</h4>
                <p>{selectedVisit.reason}</p>
              </div>

              {selectedVisit.symptoms && (
                <div className="detail-section">
                  <h4>Simptomai</h4>
                  <p>{selectedVisit.symptoms}</p>
                </div>
              )}

              {selectedVisit.diagnosis && (
                <div className="detail-section">
                  <h4>Diagnozė</h4>
                  <p>{selectedVisit.diagnosis}</p>
                </div>
              )}

              {selectedVisit.treatment && (
                <div className="detail-section">
                  <h4>Gydymas</h4>
                  <p>{selectedVisit.treatment}</p>
                </div>
              )}

              {selectedVisit.notes && (
                <div className="detail-section">
                  <h4>Papildomi komentarai</h4>
                  <p>{selectedVisit.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Visits