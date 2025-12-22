import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import visitsService from "../services/visitsService";
import veterinariansService from "../services/veterinariansService";
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
  const [veterinarians, setVeterinarians] = useState([]);
  const [showNewVisitForm, setShowNewVisitForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedVeterinarian, setSelectedVeterinarian] = useState(""); // Admin veterinaro pasirinkimas
  const [newVisit, setNewVisit] = useState({
    veterinarianUuid: "",
    userUuid: "",
    type: 0, // Preventive
    start: "",
    end: "",
    location: "",
    price: 0,
  });
  const [selectedDate, setSelectedDate] = useState("");

  const [availableSlots, setAvailableSlots] = useState([]);

  // Load veterinarians on component mount
  useEffect(() => {
    loadVeterinarians();
    loadVisits();
  }, []);

  const loadVeterinarians = async () => {
    try {
      const data = await veterinariansService.getAll();
      console.log("Veterinarians data received:", data);
      // Ensure data is an array
      if (Array.isArray(data)) {
        setVeterinarians(data);
        console.log("Set veterinarians:", data.length, "items");
      } else {
        console.warn("Veterinarians data is not an array:", data);
        setVeterinarians([]);
      }
    } catch (error) {
      console.error("Klaida įkeliant veterinarų duomenis:", error);
      setVeterinarians([]);
    }
  };

  // Atnaujinti laisvus laikus kai pasikeičia veterinaras ar data
  useEffect(() => {
    if (newVisit.veterinarianUuid && selectedDate) {
      loadAvailableSlots(newVisit.veterinarianUuid, selectedDate);
    } else {
      setAvailableSlots([]);
    }
  }, [newVisit.veterinarianUuid, selectedDate]);

  const loadAvailableSlots = async (veterinarianUuid, dateString) => {
    try {
      // Get veterinarian's workday schedule from backend
      const workdayData = await visitsService.getWorkday(veterinarianUuid);

      if (!workdayData || !workdayData.workHours) {
        setAvailableSlots([]);
        return;
      }

      const selectedDate = new Date(dateString);
      const dateOnly = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

      // Find working hours for the selected date
      const workHoursForDate = workdayData.workHours[dateOnly];

      if (
        !workHoursForDate ||
        !Array.isArray(workHoursForDate) ||
        workHoursForDate.length === 0
      ) {
        setAvailableSlots([]);
        return;
      }

      // workHoursForDate is an array of all working hours, e.g., [8, 9, 10, 11, ...]
      // Generate time slots (every hour)
      const slots = [];
      for (const hour of workHoursForDate) {
        const timeStr = `${String(hour).padStart(2, "0")}:00`;
        const slotDateTime = new Date(dateString);
        slotDateTime.setHours(hour, 0, 0, 0);

        // Check if this slot is already occupied by a visit
        const isOccupied = visits.some((visit) => {
          if (!visit.start || visit.veterinarianUuid !== veterinarianUuid)
            return false;
          const visitStart = new Date(visit.start);
          const visitEnd = new Date(visit.end);
          return slotDateTime >= visitStart && slotDateTime < visitEnd;
        });

        // Format as local time string with UTC+2 timezone offset
        const year = slotDateTime.getFullYear();
        const month = String(slotDateTime.getMonth() + 1).padStart(2, "0");
        const day = String(slotDateTime.getDate()).padStart(2, "0");
        const hours = String(slotDateTime.getHours()).padStart(2, "0");
        const minutes = String(slotDateTime.getMinutes()).padStart(2, "0");
        const seconds = String(slotDateTime.getSeconds()).padStart(2, "0");
        const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+02:00`;

        slots.push({
          time: timeStr,
          datetime: localDateTime,
          available: !isOccupied,
        });
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Klaida įkeliant laisvus laikus:", error);
      setAvailableSlots([]);
    }
  };

  const visitTypes = [
    { value: 0, label: "Profilaktinis", price: 35.0 },
    { value: 1, label: "Gydymo", price: 50.0 },
    { value: 2, label: "Chirurginis", price: 150.0 },
    { value: 3, label: "Diagnostinis", price: 45.0 },
    { value: 4, label: "Reabilitacinis", price: 60.0 },
  ];

  const loadVisits = async () => {
    try {
      setLoading(true);

      // Get user ID for filtering visits
      let userId = user?.userGuid || user?.uuid || user?.id || user?.userUUID;
      if (!userId) {
        const storedUser = localStorage.getItem("user_data");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userId =
            parsedUser?.userGuid ||
            parsedUser?.uuid ||
            parsedUser?.id ||
            parsedUser?.userUUID;
        }
      }

      const response = await visitsService.getVisits({ UserId: userId });
      console.log("Visits data received:", response);
      // Backend returns {success, data} wrapper
      const data = response?.data || response || [];
      console.log("Extracted visits:", data);
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Klaida įkeliant vizitų duomenis:", error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewVisitSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newVisit.start || !newVisit.end) {
        alert("Prašome pasirinkti datą ir laiką");
        return;
      }

      if (!newVisit.veterinarianUuid) {
        alert("Prašome pasirinkti veterinarą");
        return;
      }

      // Get user UUID from user object
      let userUuid = user?.userGuid || user?.uuid || user?.id || user?.userUUID;

      console.log("Checking user UUID:", {
        userGuid: user?.userGuid,
        uuid: user?.uuid,
        id: user?.id,
        userUUID: user?.userUUID,
        finalUserUuid: userUuid,
      });

      // If still no UUID, try to get from stored user data
      if (!userUuid || userUuid === "") {
        const storedUser = localStorage.getItem("user_data");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            userUuid =
              parsedUser?.userGuid ||
              parsedUser?.uuid ||
              parsedUser?.id ||
              parsedUser?.userUUID;
            console.log("Got UUID from localStorage:", userUuid);
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }
      }

      if (!userUuid || userUuid === "") {
        alert("Nerastas vartotojo ID. Prašome prisijungti iš naujo.");
        console.error("No user UUID found. User object:", user);
        return;
      }

      const visitData = {
        type: parseInt(newVisit.type),
        start: newVisit.start,
        end: newVisit.end,
        location: "Centrinė Veterinarijos klinika",
        price: parseFloat(newVisit.price) || 50.0,
        veterinarianUuid: newVisit.veterinarianUuid,
        userUuid: userUuid,
      };

      console.log("Sending visit data:", visitData);
      console.log("User object:", user);

      await visitsService.createVisit(visitData);

      setNewVisit({
        veterinarianUuid: "",
        userUuid: "",
        type: 0,
        start: "",
        end: "",
        location: "",
        price: 0,
      });
      setSelectedDate("");
      setShowNewVisitForm(false);
      await loadVisits(); // Reload visits after creation
      alert("Vizitas sėkmingai užregistruotas!");
    } catch (error) {
      console.error("Klaida registruojant vizitą:", error);
      alert(
        "Klaida registruojant vizitą: " + (error.message || "Nežinoma klaida")
      );
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
      // Admin filter by selected veterinarian
      if (isAdmin && selectedVeterinarian) {
        if (visit.veterinarianUuid !== selectedVeterinarian) return false;
      }
      // Filter by status - backend doesn't return status, so skip this filter for now
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.start) - new Date(a.start);
      }
      return 0;
    });

  console.log("Visits rendering info:", {
    totalVisits: visits.length,
    filteredVisits: filteredVisits.length,
    isAdmin,
    selectedVeterinarian,
    user: user,
  });

  const cancelVisit = async (visitId) => {
    if (window.confirm("Ar tikrai norite atšaukti šį vizitą?")) {
      try {
        await visitsService.cancelVisit(visitId);
        await loadVisits(); // Reload visits
        alert("Vizitas sėkmingai atšauktas");
      } catch (error) {
        console.error("Klaida atšaukiant vizitą:", error);
        alert("Nepavyko atšaukti vizito");
      }
    }
  };

  const startEditVisit = (visit) => {
    const visitType = visitTypes.find((t) => t.value === visit.type);
    const startDate = new Date(visit.start);
    const dateOnly = `${startDate.getFullYear()}-${String(
      startDate.getMonth() + 1
    ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

    // Format start and end times to match slot format (local time with +02:00 offset)
    const formatLocalDateTime = (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+02:00`;
    };

    setEditingVisit(visit);
    setNewVisit({
      veterinarianUuid: visit.veterinarianUuid,
      userUuid: visit.userUuid,
      type: visit.type,
      start: formatLocalDateTime(visit.start),
      end: formatLocalDateTime(visit.end),
      location: visit.location,
      price: visitType?.price || visit.price,
    });
    setSelectedDate(dateOnly);
    setShowNewVisitForm(true);

    // Load available slots for the selected vet and date
    if (visit.veterinarianUuid && dateOnly) {
      loadAvailableSlots(visit.veterinarianUuid, dateOnly);
    }
  };

  const handleUpdateVisit = async (e) => {
    e.preventDefault();
    try {
      if (!newVisit.start || !newVisit.end) {
        alert("Prašome pasirinkti datą ir laiką");
        return;
      }

      const visitData = {
        id: editingVisit.id,
        type: parseInt(newVisit.type),
        start: newVisit.start,
        end: newVisit.end,
        location: "Centrinė Veterinarijos klinika",
        price: parseFloat(newVisit.price) || 50.0,
      };

      console.log("Updating visit:", visitData);

      await visitsService.updateVisit(editingVisit.id, visitData);

      setNewVisit({
        veterinarianUuid: "",
        userUuid: "",
        type: 0,
        start: "",
        end: "",
        location: "",
        price: 35.0,
      });
      setSelectedDate("");
      setShowNewVisitForm(false);
      setEditingVisit(null);
      await loadVisits();
      alert("Vizitas sėkmingai atnaujintas!");
    } catch (error) {
      console.error("Klaida atnaujinant vizitą:", error);
      alert(
        "Klaida atnaujinant vizitą: " + (error.message || "Nežinoma klaida")
      );
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
            {Array.isArray(veterinarians) &&
              veterinarians.map((vet) => (
                <option key={vet.veterinarianGuid} value={vet.veterinarianGuid}>
                  {vet.name} {vet.surname} - {vet.rank || "Veterinaras"}
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
          filteredVisits.map((visit) => {
            const vet = Array.isArray(veterinarians)
              ? veterinarians.find(
                  (v) => v.veterinarianGuid === visit.veterinarianUuid
                )
              : null;
            const startDate = new Date(visit.start);
            const endDate = new Date(visit.end);

            return (
              <div key={visit.id} className="visit-card">
                <div className="visit-main-info">
                  <div className="visit-header">
                    <h3>
                      {vet ? `${vet.name} ${vet.surname}` : "Veterinaras"}
                    </h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: "#17a2b8" }}
                    >
                      Suplanuotas
                    </span>
                  </div>

                  <div className="visit-details">
                    <div className="detail-row">
                      <span className="label">Specializacija:</span>
                      <span>{vet?.rank || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Data:</span>
                      <span>{startDate.toLocaleDateString("lt-LT")}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Laikas:</span>
                      <span>
                        {startDate.toLocaleTimeString("lt-LT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {endDate.toLocaleTimeString("lt-LT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Tipas:</span>
                      <span>{getTypeLabel(visit.type)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Vieta:</span>
                      <span>{visit.location}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Kaina:</span>
                      <span>{visit.price} €</span>
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
                    className="btn primary"
                    onClick={() => startEditVisit(visit)}
                    title="Redaguoti vizitą"
                  >
                    ⚙️ Redaguoti
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => cancelVisit(visit.id)}
                  >
                    Atšaukti
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Naujo/Redaguojamo vizito forma */}
      {showNewVisitForm && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowNewVisitForm(false);
            setEditingVisit(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingVisit ? "Redaguoti vizitą" : "Registruoti naują vizitą"}
              </h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowNewVisitForm(false);
                  setEditingVisit(null);
                }}
              >
                ×
              </button>
            </div>

            <form
              className="visit-form"
              onSubmit={editingVisit ? handleUpdateVisit : handleNewVisitSubmit}
            >
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Veterinaras*</label>
                  <select
                    required
                    value={newVisit.veterinarianUuid}
                    onChange={(e) => {
                      setNewVisit({
                        ...newVisit,
                        veterinarianUuid: e.target.value,
                      });
                    }}
                    disabled={!!editingVisit}
                    style={
                      editingVisit
                        ? { backgroundColor: "#f0f0f0", cursor: "not-allowed" }
                        : {}
                    }
                  >
                    <option value="">Pasirinkite veterinarą</option>
                    {(() => {
                      console.log(
                        "Rendering veterinarians dropdown:",
                        veterinarians
                      );
                      if (!Array.isArray(veterinarians)) {
                        console.log("Veterinarians is not an array!");
                        return null;
                      }
                      if (veterinarians.length === 0) {
                        console.log("Veterinarians array is empty!");
                        return null;
                      }
                      return veterinarians.map((vet) => {
                        console.log("Rendering vet:", vet);
                        return (
                          <option
                            key={vet.veterinarianGuid}
                            value={vet.veterinarianGuid}
                          >
                            {vet.name} {vet.surname} -{" "}
                            {vet.rank || "Veterinaras"}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data*</label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      setSelectedDate(dateValue);
                      setNewVisit({
                        ...newVisit,
                        start: "",
                        end: "",
                      });
                    }}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Laikas*</label>
                  <select
                    required
                    value={newVisit.start || ""}
                    onChange={(e) => {
                      const startDateTime = e.target.value;

                      // Parse the start time and add 1 hour directly
                      // startDateTime format: "2025-12-22T18:00:00+02:00"
                      const timeParts = startDateTime.match(
                        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+02:00$/
                      );
                      if (timeParts) {
                        const [, year, month, day, hours, minutes, seconds] =
                          timeParts;
                        const endHour = String(parseInt(hours) + 1).padStart(
                          2,
                          "0"
                        );
                        const endDateTime = `${year}-${month}-${day}T${endHour}:${minutes}:${seconds}+02:00`;

                        setNewVisit({
                          ...newVisit,
                          start: startDateTime,
                          end: endDateTime,
                        });
                      }
                    }}
                    disabled={!newVisit.veterinarianUuid || !selectedDate}
                  >
                    <option value="">
                      {!newVisit.veterinarianUuid || !selectedDate
                        ? "Pirmiausia pasirinkite veterinarą ir datą"
                        : "Pasirinkite laiką"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option
                        key={slot.datetime}
                        value={slot.datetime}
                        disabled={!slot.available}
                      >
                        {slot.time} {slot.available ? "" : "(užimta)"}
                      </option>
                    ))}
                  </select>
                  {availableSlots.length === 0 &&
                    newVisit.veterinarianUuid &&
                    selectedDate && (
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
                  onChange={(e) => {
                    const typeValue = parseInt(e.target.value);
                    const selectedType = visitTypes.find(
                      (t) => t.value === typeValue
                    );
                    setNewVisit({
                      ...newVisit,
                      type: typeValue,
                      price: selectedType?.price || 50.0,
                    });
                  }}
                >
                  {visitTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.price.toFixed(2)}€
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vieta</label>
                <input
                  type="text"
                  value="Centrinė Veterinarijos klinika"
                  disabled
                  style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label>Kaina (€)</label>
                <input
                  type="text"
                  value={newVisit.price.toFixed(2) + " €"}
                  disabled
                  style={{
                    backgroundColor: "#f0f0f0",
                    cursor: "not-allowed",
                    color: "#333",
                  }}
                />
                <small
                  style={{
                    color: "#666",
                    marginTop: "0.25rem",
                    display: "block",
                  }}
                >
                  Kaina nustatyta automatiškai pagal vizito tipą
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setShowNewVisitForm(false);
                    setEditingVisit(null);
                  }}
                >
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  {editingVisit ? "Atnaujinti vizitą" : "Registruoti vizitą"}
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
                    <span className="label">Veterinaras:</span>
                    <span>
                      {(() => {
                        const vet = Array.isArray(veterinarians)
                          ? veterinarians.find(
                              (v) =>
                                v.veterinarianGuid ===
                                selectedVisit.veterinarianUuid
                            )
                          : null;
                        return vet ? `${vet.name} ${vet.surname}` : "N/A";
                      })()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Specializacija:</span>
                    <span>
                      {(() => {
                        const vet = Array.isArray(veterinarians)
                          ? veterinarians.find(
                              (v) =>
                                v.veterinarianGuid ===
                                selectedVisit.veterinarianUuid
                            )
                          : null;
                        return vet?.rank || "N/A";
                      })()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Pradžia:</span>
                    <span>
                      {new Date(selectedVisit.start).toLocaleString("lt-LT")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Pabaiga:</span>
                    <span>
                      {new Date(selectedVisit.end).toLocaleString("lt-LT")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Tipas:</span>
                    <span>{getTypeLabel(selectedVisit.type)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Vieta:</span>
                    <span>{selectedVisit.location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Kaina:</span>
                    <span>{selectedVisit.price} €</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn secondary"
                  onClick={() => setSelectedVisit(null)}
                >
                  Uždaryti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visits;
