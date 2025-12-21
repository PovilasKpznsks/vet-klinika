import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import visitsService from "../services/visitsService";
import "../styles/Visits.css";

// Role types: 0 = Administrator, 1 = Veterinarian, 2 = Client
const ROLE_TYPES = {
  Administrator: 0,
  Veterinarian: 1,
  Client: 2,
};

const Visits = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLE_TYPES.Administrator;
  const [visits, setVisits] = useState([]);
  const [showNewVisitForm, setShowNewVisitForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedVeterinarian, setSelectedVeterinarian] = useState(""); // Admin veterinaro pasirinkimas
  const [newVisit, setNewVisit] = useState({
    veterinarianId: "",
    doctorName: "",
    specialty: "",
    date: "",
    time: "",
    reason: "",
    symptoms: "",
    notes: "",
    type: "consultation",
  });

  const [availableSlots, setAvailableSlots] = useState([]);

  // Atnaujinti laisvus laikus kai pasikeičia veterinaras ar data
  useEffect(() => {
    if (newVisit.veterinarianId && newVisit.date) {
      const slots = getAvailableTimeSlots(
        newVisit.veterinarianId,
        newVisit.date
      );
      setAvailableSlots(slots);
      // Išvalyti pasirinktą laiką jei jis nebeprieinamas
      if (newVisit.time) {
        const selectedSlot = slots.find((s) => s.time === newVisit.time);
        if (!selectedSlot || !selectedSlot.available) {
          setNewVisit((prev) => ({ ...prev, time: "" }));
        }
      }
    } else {
      setAvailableSlots([]);
    }
  }, [newVisit.veterinarianId, newVisit.date, visits]);

  // Veterinarų sąrašas su darbo valandomis
  const veterinarians = [
    {
      id: 1,
      name: "Dr. Petras Petraitis",
      specialty: "Chirurgas",
      workDays: [1, 2, 3, 4, 5], // Pirmadienis-Penktadienis
      workHours: { start: "09:00", end: "17:00" },
    },
    {
      id: 2,
      name: "Dr. Ana Kazlienė",
      specialty: "Kardiologas",
      workDays: [1, 2, 3, 4, 5],
      workHours: { start: "10:00", end: "18:00" },
    },
    {
      id: 3,
      name: "Dr. Jonas Jonaitis",
      specialty: "Dermatologas",
      workDays: [2, 3, 4, 5, 6], // Antradienis-Šeštadienis
      workHours: { start: "08:00", end: "16:00" },
    },
  ];

  const specialties = [
    "Chirurgas",
    "Kardiologas",
    "Dermatologas",
    "Oftalmologas",
    "Ortopedas",
  ];

  // Generuoti laisvus laikus pagal veterinarą ir datą
  const getAvailableTimeSlots = (veterinarianId, selectedDate) => {
    if (!veterinarianId || !selectedDate) return [];

    const vet = veterinarians.find((v) => v.id === parseInt(veterinarianId));
    if (!vet) return [];

    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();

    // Tikrinti ar veterinaras dirba tą dieną
    if (!vet.workDays.includes(dayOfWeek)) {
      return [];
    }

    // Generuoti laiko intervalus (kas 30 min)
    const slots = [];
    const [startHour, startMin] = vet.workHours.start.split(":").map(Number);
    const [endHour, endMin] = vet.workHours.end.split(":").map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin < endMin)
    ) {
      const timeStr = `${String(currentHour).padStart(2, "0")}:${String(
        currentMin
      ).padStart(2, "0")}`;

      // Tikrinti ar šis laikas jau užimtas
      const isOccupied = visits.some(
        (visit) =>
          visit.doctorName === vet.name &&
          visit.date === selectedDate &&
          visit.time === timeStr &&
          visit.status !== "cancelled"
      );

      slots.push({
        time: timeStr,
        available: !isOccupied,
      });

      // Pridėti 30 min
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  };

  const visitTypes = [
    { value: "consultation", label: "Konsultacija" },
    { value: "examination", label: "Tyrimas" },
    { value: "procedure", label: "Procedūra" },
    { value: "surgery", label: "Operacija" },
    { value: "followup", label: "Pakartotinis vizitas" },
  ];

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const data = await visitsService.getVisits().catch(() => getMockVisits());
      setVisits(data);
    } catch (error) {
      console.error("Klaida įkeliant vizitų duomenis:", error);
      setVisits(getMockVisits());
    } finally {
      setLoading(false);
    }
  };

  const getMockVisits = () => [
    {
      id: 1,
      doctorName: "Dr. Petras Petraitis",
      specialty: "Šeimos gydytojas",
      date: "2024-01-15",
      time: "14:30",
      reason: "Profilaktinis patikrinimas",
      symptoms: "Bendras nuovargis, galvos skausmai",
      diagnosis: "Arterinė hipertenzija",
      treatment: "Paskirti vaistai nuo spaudimo, dietos rekomendacijos",
      status: "completed",
      type: "consultation",
      notes: "Rekomenduojama pakartoti vizitą po mėnesio",
      createdAt: "2024-01-15T14:30:00Z",
    },
    {
      id: 2,
      doctorName: "Dr. Ana Kazlienė",
      specialty: "Kardiologas",
      date: "2024-02-03",
      time: "10:15",
      reason: "Širdies ritmo sutrikimai",
      symptoms: "Širdies plakimas, dusulys",
      diagnosis: "Širdies aritmija",
      treatment: "EKG tyrimas, beta-blokatorių skyrimas",
      status: "completed",
      type: "examination",
      notes: "Reikalingas kardiologinis stebėjimas",
      createdAt: "2024-02-03T10:15:00Z",
    },
    {
      id: 3,
      doctorName: "Dr. Jonas Jonaitis",
      specialty: "Dermatologas",
      date: "2024-12-20",
      time: "16:00",
      reason: "Odos bėrimų tyrimas",
      symptoms: "Niežulys, raudonos dėmės",
      status: "scheduled",
      type: "consultation",
      notes: "Būtina atsinešti ankstesnių tyrimų rezultatus",
      createdAt: "2024-12-06T12:00:00Z",
    },
  ];

  const handleNewVisitSubmit = async (e) => {
    e.preventDefault();
    try {
      const visitData = {
        ...newVisit,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };

      await visitsService.createVisit(visitData).catch(() => {
        // Mock pridėjimas
        const mockVisit = {
          ...visitData,
          id: visits.length + 1,
        };
        setVisits([...visits, mockVisit]);
      });

      setNewVisit({
        doctorName: "",
        specialty: "",
        date: "",
        time: "",
        reason: "",
        symptoms: "",
        notes: "",
        type: "consultation",
      });
      setShowNewVisitForm(false);
      alert("Vizitas sėkmingai užregistruotas!");
    } catch (error) {
      console.error("Klaida registruojant vizitą:", error);
      alert("Klaida registruojant vizitą");
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "scheduled":
        return "Suplanuotas";
      case "completed":
        return "Įvykęs";
      case "cancelled":
        return "Atšauktas";
      default:
        return "Nežinoma";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "#17a2b8";
      case "completed":
        return "#28a745";
      case "cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getTypeLabel = (type) => {
    return visitTypes.find((t) => t.value === type)?.label || type;
  };

  const filteredVisits = visits
    .filter((visit) => {
      // Jei admin, rodyti tik pasirinkto veterinaro vizitus
      if (isAdmin) {
        if (!selectedVeterinarian) return false;
        const vet = veterinarians.find(
          (v) => v.id === parseInt(selectedVeterinarian)
        );
        if (!vet || visit.doctorName !== vet.name) return false;
      }
      // Filtruoti pagal būseną
      return filterStatus === "all" || visit.status === filterStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date) - new Date(a.date);
      }
      return a[sortBy]?.localeCompare(b[sortBy]) || 0;
    });

  const cancelVisit = async (visitId) => {
    if (window.confirm("Ar tikrai norite atšaukti šį vizitą?")) {
      try {
        await visitsService.cancelVisit(visitId).catch(() => {
          // Mock atnaujinimas
          setVisits(
            visits.map((visit) =>
              visit.id === visitId ? { ...visit, status: "cancelled" } : visit
            )
          );
        });
        alert("Vizitas sėkmingai atšauktas");
      } catch (error) {
        console.error("Klaida atšaukiant vizitą:", error);
      }
    }
  };

  const beginEditVisit = (visit) => {
    setEditingVisit({ ...visit });
    setShowNewVisitForm(false);
    setSelectedVisit(null);
  };

  const saveEditVisit = async (e) => {
    e.preventDefault();
    if (!editingVisit) return;
    try {
      await visitsService
        .updateVisit(editingVisit.id, editingVisit)
        .catch(() => {
          // Mock update
          setVisits((prev) =>
            prev.map((v) =>
              v.id === editingVisit.id ? { ...editingVisit } : v
            )
          );
        });
      setEditingVisit(null);
      alert("Vizitas atnaujintas");
    } catch (err) {
      alert("Nepavyko atnaujinti vizito");
    }
  };

  const exportToExcel = () => {
    // Sukurti CSV formatą (Excel gali atidaryti CSV failus)
    const headers = [
      "Data",
      "Laikas",
      "Veterinaras",
      "Specializacija",
      "Tipas",
      "Priežastis",
      "Simptomai",
      "Diagnoze",
      "Gydymas",
      "Būsena",
      "Pastabos",
    ];

    const rows = filteredVisits.map((visit) => [
      new Date(visit.date).toLocaleDateString("lt-LT"),
      visit.time || "",
      visit.doctorName || "",
      visit.specialty || "",
      visitTypes.find((t) => t.value === visit.type)?.label || visit.type,
      visit.reason || "",
      visit.symptoms || "",
      visit.diagnosis || "",
      visit.treatment || "",
      getStatusLabel(visit.status),
      visit.notes || "",
    ]);

    // Konvertuoti į CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Sukurti blob su UTF-8 BOM (kad Excel teisingai atpažintų lietuviškas raides)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Atsisiusti failą
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const vetName =
      isAdmin && selectedVeterinarian
        ? veterinarians
            .find((v) => v.id === parseInt(selectedVeterinarian))
            ?.name.replace(/\s+/g, "_")
        : "visi";
    const fileName = `vizitai_${vetName}_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="visits-page">
        <div className="loading-spinner">Kraunami duomenys...</div>
      </div>
    );
  }

  return (
    <div className="visits-page">
      <div className="visits-header">
        <h2>{isAdmin ? "Veterinarų dienotvarkė" : "Vizitai pas gydytojus"}</h2>
        <p>
          {isAdmin
            ? "Peržiūrėkite veterinarų užimtumą ir tvarkykite dienotvarkę"
            : "Registruokite vizitus ir peržiūrėkite savo sveikatos istoriją"}
        </p>
      </div>

      {isAdmin && (
        <div className="admin-vet-selector" style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "600",
            }}
          >
            Pasirinkite veterinarą:
          </label>
          <select
            value={selectedVeterinarian}
            onChange={(e) => setSelectedVeterinarian(e.target.value)}
            style={{
              padding: "0.75rem",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "2px solid #e9ecef",
              minWidth: "300px",
            }}
          >
            <option value="">-- Pasirinkite veterinarą --</option>
            {veterinarians.map((vet) => (
              <option key={vet.id} value={vet.id}>
                {vet.name} - {vet.specialty}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="visits-actions">
        <div style={{ display: "flex", gap: "1rem" }}>
          {!isAdmin && (
            <button
              className="btn primary"
              onClick={() => setShowNewVisitForm(true)}
            >
              + Registruoti naują vizitą
            </button>
          )}
          {isAdmin && selectedVeterinarian && (
            <button
              className="btn secondary"
              onClick={exportToExcel}
              disabled={filteredVisits.length === 0}
              title="Generuoti pasirinkto veterinaro dienotvarkės suvestinę Excel formatu"
            >
              📄 Eksportuoti į Excel
            </button>
          )}
        </div>

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

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Rūšiuoti pagal datą</option>
            <option value="doctorName">Rūšiuoti pagal gydytoją</option>
            <option value="specialty">Rūšiuoti pagal sritį</option>
          </select>
        </div>
      </div>

      <div className="visits-list">
        {isAdmin && !selectedVeterinarian ? (
          <div className="no-visits">
            <p>Pasirinkite veterinarą, kad matytumėte jo dienotvarkę</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="no-visits">
            <p>Vizitų nerasta.</p>
          </div>
        ) : (
          filteredVisits.map((visit) => (
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
                    <span>
                      {new Date(visit.date).toLocaleDateString("lt-LT")}
                    </span>
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
                <button
                  className="btn secondary"
                  onClick={() => beginEditVisit(visit)}
                >
                  Redaguoti
                </button>
                {visit.status === "scheduled" && (
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
        <div
          className="modal-overlay"
          onClick={() => setShowNewVisitForm(false)}
        >
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
                <div className="form-group full-width">
                  <label>Veterinaras*</label>
                  <select
                    required
                    value={newVisit.veterinarianId}
                    onChange={(e) => {
                      const vet = veterinarians.find(
                        (v) => v.id === parseInt(e.target.value)
                      );
                      setNewVisit({
                        ...newVisit,
                        veterinarianId: e.target.value,
                        doctorName: vet ? vet.name : "",
                        specialty: vet ? vet.specialty : "",
                      });
                    }}
                  >
                    <option value="">Pasirinkite veterinarą</option>
                    {veterinarians.map((vet) => (
                      <option key={vet.id} value={vet.id}>
                        {vet.name} - {vet.specialty}
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
                    onChange={(e) =>
                      setNewVisit({ ...newVisit, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Laikas*</label>
                  <select
                    required
                    value={newVisit.time}
                    onChange={(e) =>
                      setNewVisit({ ...newVisit, time: e.target.value })
                    }
                    disabled={!newVisit.veterinarianId || !newVisit.date}
                  >
                    <option value="">
                      {!newVisit.veterinarianId || !newVisit.date
                        ? "Pirmiausia pasirinkite veterinarą ir datą"
                        : "Pasirinkite laiką"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option
                        key={slot.time}
                        value={slot.time}
                        disabled={!slot.available}
                      >
                        {slot.time} {slot.available ? "" : "(užimta)"}
                      </option>
                    ))}
                  </select>
                  {availableSlots.length === 0 &&
                    newVisit.veterinarianId &&
                    newVisit.date && (
                      <small style={{ color: "#dc3545", marginTop: "0.25rem" }}>
                        Veterinaras tą dieną nedirba
                      </small>
                    )}
                </div>
              </div>

              <div className="form-group">
                <label>Vizito tipas*</label>
                <select
                  required
                  value={newVisit.type}
                  onChange={(e) =>
                    setNewVisit({ ...newVisit, type: e.target.value })
                  }
                >
                  {visitTypes.map((type) => (
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
                  onChange={(e) =>
                    setNewVisit({ ...newVisit, reason: e.target.value })
                  }
                  placeholder="Aprašykite vizito priežastį"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Simptomai</label>
                <textarea
                  value={newVisit.symptoms}
                  onChange={(e) =>
                    setNewVisit({ ...newVisit, symptoms: e.target.value })
                  }
                  placeholder="Aprašykite simptomus (neprivaloma)"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Papildomi komentarai</label>
                <textarea
                  value={newVisit.notes}
                  onChange={(e) =>
                    setNewVisit({ ...newVisit, notes: e.target.value })
                  }
                  placeholder="Papildoma informacija (neprivaloma)"
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowNewVisitForm(false)}
                >
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
                    <span>
                      {new Date(selectedVisit.date).toLocaleDateString("lt-LT")}
                    </span>
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
                        fontWeight: "bold",
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
              <div className="modal-actions">
                <button
                  className="btn secondary"
                  onClick={() => setSelectedVisit(null)}
                >
                  Uždaryti
                </button>
                <button
                  className="btn primary"
                  onClick={() => beginEditVisit(selectedVisit)}
                >
                  Redaguoti vizitą
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vizito redagavimo modalas */}
      {editingVisit && (
        <div className="modal-overlay" onClick={() => setEditingVisit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Redaguoti vizitą</h3>
              <button
                className="close-btn"
                onClick={() => setEditingVisit(null)}
              >
                ×
              </button>
            </div>

            <form className="visit-form" onSubmit={saveEditVisit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Gydytojo vardas*</label>
                  <input
                    type="text"
                    required
                    value={editingVisit.doctorName}
                    onChange={(e) =>
                      setEditingVisit({
                        ...editingVisit,
                        doctorName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Specializacija*</label>
                  <select
                    required
                    value={editingVisit.specialty}
                    onChange={(e) =>
                      setEditingVisit({
                        ...editingVisit,
                        specialty: e.target.value,
                      })
                    }
                  >
                    <option value="">Pasirinkite specializaciją</option>
                    {specialties.map((specialty) => (
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
                    value={editingVisit.date}
                    onChange={(e) =>
                      setEditingVisit({ ...editingVisit, date: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Laikas*</label>
                  <input
                    type="time"
                    required
                    value={editingVisit.time}
                    onChange={(e) =>
                      setEditingVisit({ ...editingVisit, time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Vizito tipas*</label>
                <select
                  required
                  value={editingVisit.type}
                  onChange={(e) =>
                    setEditingVisit({ ...editingVisit, type: e.target.value })
                  }
                >
                  {visitTypes.map((type) => (
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
                  value={editingVisit.reason}
                  onChange={(e) =>
                    setEditingVisit({ ...editingVisit, reason: e.target.value })
                  }
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Simptomai</label>
                <textarea
                  value={editingVisit.symptoms}
                  onChange={(e) =>
                    setEditingVisit({
                      ...editingVisit,
                      symptoms: e.target.value,
                    })
                  }
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Papildomi komentarai</label>
                <textarea
                  value={editingVisit.notes}
                  onChange={(e) =>
                    setEditingVisit({ ...editingVisit, notes: e.target.value })
                  }
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setEditingVisit(null)}
                >
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  Išsaugoti pakeitimus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visits;
