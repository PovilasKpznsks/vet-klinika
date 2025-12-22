import { useEffect, useState } from "react";
import veterinariansService from "../services/veterinariansService";

const AdminVets = () => {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showWorkdayModal, setShowWorkdayModal] = useState(false);
  const [selectedVetForWorkday, setSelectedVetForWorkday] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [workdayForm, setWorkdayForm] = useState({
    date: "",
    startHour: 8,
    endHour: 18,
  });
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    role: 1, // Veterinarian role
    phoneNumber: "",
    photoUrl: "",
    birthDate: "",
    rank: "",
    responsibilities: "",
    education: "",
    salary: "",
    fullTime: true,
    hireDate: "",
    experienceYears: 0,
    gender: 0, // 0=Male, 1=Female
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await veterinariansService.getAll();
      // Service already unwraps the response to return array directly
      const vetsData = Array.isArray(res) ? res : [];
      setVets(vetsData);
    } catch (error) {
      console.error("Klaida įkeliant veterinarų duomenis:", error);
      setVets([]);
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      surname: "",
      email: "",
      password: "",
      role: 1,
      phoneNumber: "",
      photoUrl: "",
      birthDate: "",
      rank: "",
      responsibilities: "",
      education: "",
      salary: "",
      fullTime: 1.0,
      hireDate: "",
      experienceYears: 0,
      gender: 0,
    });
    setShowForm(true);
  };
  const startEdit = (v) => {
    // Use veterinarianGuid for backend API calls
    setEditingId(v.veterinarianGuid);
    setForm({
      name: v.name || "",
      surname: v.surname || "",
      email: v.email || "",
      password: "",
      role: v.role || 1,
      phoneNumber: v.phoneNumber || "",
      photoUrl: v.photoUrl || "",
      birthDate: v.birthDate ? v.birthDate.split("T")[0] : "",
      rank: v.rank || "",
      responsibilities: v.responsibilities || "",
      education: v.education || "",
      salary: v.salary || "",
      fullTime: v.fullTime !== undefined ? v.fullTime : 1.0,
      hireDate: v.hireDate ? v.hireDate.split("T")[0] : "",
      experienceYears: v.experienceYears || 0,
      gender: v.gender || 0,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update only allows certain fields
        const updateData = {
          birthDate: form.birthDate
            ? `${form.birthDate}T00:00:00`
            : new Date().toISOString(),
          rank: form.rank,
          responsibilities: form.responsibilities,
          education: form.education,
          salary: parseFloat(form.salary) || 0,
          fullTime: parseFloat(form.fullTime) || 1.0,
          hireDate: form.hireDate
            ? `${form.hireDate}T00:00:00`
            : new Date().toISOString(),
          experienceYears: parseInt(form.experienceYears) || 0,
          gender: parseInt(form.gender),
        };
        const res = await veterinariansService.update(editingId, updateData);
        if (res.success) {
          await load(); // Reload all data
        }
      } else {
        // Create requires all fields
        const createData = {
          name: form.name,
          surname: form.surname,
          email: form.email,
          password: form.password,
          role: parseInt(form.role),
          phoneNumber: form.phoneNumber,
          photoUrl: form.photoUrl || "",
          birthDate: form.birthDate
            ? `${form.birthDate}T00:00:00`
            : new Date().toISOString(),
          rank: form.rank,
          responsibilities: form.responsibilities,
          education: form.education,
          salary: parseFloat(form.salary) || 0,
          fullTime: parseFloat(form.fullTime) || 1.0,
          hireDate: form.hireDate
            ? `${form.hireDate}T00:00:00`
            : new Date().toISOString(),
          experienceYears: parseInt(form.experienceYears) || 0,
          gender: parseInt(form.gender),
        };
        const res = await veterinariansService.create(createData);
        if (res.success) {
          await load(); // Reload all data
        }
      }
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error("Klaida išsaugant veterinarą:", error);
    }
  };

  const removeVet = async (id) => {
    if (!window.confirm("Ar tikrai norite pašalinti šį veterinarą?")) return;
    try {
      const res = await veterinariansService.remove(id);
      if (res.success) {
        setVets(vets.filter((v) => v.veterinarianGuid !== id));
      }
    } catch (error) {
      console.error("Klaida šalinant veterinarą:", error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await veterinariansService.downloadExcel(dateRange);
      setShowDownloadModal(false);
      setDateRange({ startDate: "", endDate: "" });
    } catch (error) {
      console.error("Klaida atsisiunčiant Excel:", error);
    }
  };

  const startAddWorkday = (vet) => {
    setSelectedVetForWorkday(vet);
    setWorkdayForm({
      date: new Date().toISOString().split("T")[0],
      startHour: 8,
      endHour: 18,
    });
    setShowWorkdayModal(true);
  };

  const saveWorkday = async (e) => {
    e.preventDefault();
    try {
      const data = {
        veterinarianId: selectedVetForWorkday.veterinarianGuid,
        date: workdayForm.date,
        startHour: parseInt(workdayForm.startHour),
        endHour: parseInt(workdayForm.endHour),
      };

      const response = await fetch("http://localhost:5068/api/Visit/workday", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Close modal first
      setShowWorkdayModal(false);
      setSelectedVetForWorkday(null);
    } catch (error) {
      console.error("Klaida išsaugant darbo laiką:", error);
      setShowWorkdayModal(false);
    }
  };

  if (loading) return <div>Kraunama...</div>;

  return (
    <div>
      <div className="pets-header">
        <h3>Veterinarai</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn secondary"
            onClick={() => setShowDownloadModal(true)}
          >
            📥 Atsisiųsti Excel
          </button>
          <button className="btn primary" onClick={startCreate}>
            + Pridėti
          </button>
        </div>
      </div>

      {vets.length === 0 ? (
        <div className="empty-state">
          <p>Veterinarų nėra</p>
        </div>
      ) : (
        <div className="pets-grid">
          {vets.map((v) => (
            <div key={v.id || v.veterinarianGuid} className="pet-card">
              <div className="pet-card-header">
                <div className="pet-avatar">🩺</div>
                <div className="pet-info">
                  <h4>
                    {v.name} {v.surname}
                  </h4>
                  <p>{v.rank || "Veterinaras"}</p>
                </div>
              </div>
              <div className="pet-details">
                <div className="detail-row">
                  <span className="label">El. paštas:</span>
                  <span>{v.email}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Telefonas:</span>
                  <span>{v.phoneNumber || "-"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Pareigos:</span>
                  <span>{v.responsibilities || "-"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Patirtis:</span>
                  <span>{v.experienceYears || 0} m.</span>
                </div>
              </div>
              <div className="pet-actions">
                <button
                  className="btn secondary small"
                  onClick={() => startEdit(v)}
                >
                  Redaguoti
                </button>
                <button
                  className="btn primary small"
                  onClick={() => startAddWorkday(v)}
                >
                  🕒 Pridėti laiką
                </button>
                <button
                  className="btn danger small"
                  onClick={() => removeVet(v.veterinarianGuid)}
                >
                  Šalinti
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingId ? "Redaguoti veterinarą" : "Pridėti veterinarą"}
              </h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <form className="pet-form" onSubmit={save}>
              <div className="form-grid">
                {!editingId && (
                  <>
                    <div className="form-group">
                      <label>Vardas*</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Pvz.: Jonas"
                      />
                    </div>
                    <div className="form-group">
                      <label>Pavardė*</label>
                      <input
                        required
                        value={form.surname}
                        onChange={(e) =>
                          setForm({ ...form, surname: e.target.value })
                        }
                        placeholder="Pvz.: Jonaitis"
                      />
                    </div>
                    <div className="form-group">
                      <label>El. paštas*</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Slaptažodis*</label>
                      <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefono numeris</label>
                      <input
                        value={form.phoneNumber}
                        onChange={(e) =>
                          setForm({ ...form, phoneNumber: e.target.value })
                        }
                        placeholder="+370..."
                      />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label>Gimimo data*</label>
                  <input
                    type="date"
                    required
                    value={form.birthDate}
                    onChange={(e) =>
                      setForm({ ...form, birthDate: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Pareigos*</label>
                  <input
                    required
                    value={form.rank}
                    onChange={(e) => setForm({ ...form, rank: e.target.value })}
                    placeholder="Pvz.: Chirurgas"
                  />
                </div>
                <div className="form-group">
                  <label>Atsakomybės</label>
                  <input
                    value={form.responsibilities}
                    onChange={(e) =>
                      setForm({ ...form, responsibilities: e.target.value })
                    }
                    placeholder="Pvz.: Chirurgija, skubios pagalbos"
                  />
                </div>
                <div className="form-group">
                  <label>Išsilavinimas</label>
                  <input
                    value={form.education}
                    onChange={(e) =>
                      setForm({ ...form, education: e.target.value })
                    }
                    placeholder="Pvz.: Veterinarijos magistras"
                  />
                </div>
                <div className="form-group">
                  <label>Atlyginimas (€)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.salary}
                    onChange={(e) =>
                      setForm({ ...form, salary: e.target.value })
                    }
                    placeholder="2000.00"
                  />
                </div>
                <div className="form-group">
                  <label>Priimimo į darbą data</label>
                  <input
                    type="date"
                    value={form.hireDate}
                    onChange={(e) =>
                      setForm({ ...form, hireDate: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Darbo patirtis (metais)</label>
                  <input
                    type="number"
                    value={form.experienceYears}
                    onChange={(e) =>
                      setForm({ ...form, experienceYears: e.target.value })
                    }
                    placeholder="5"
                  />
                </div>
                <div className="form-group">
                  <label>Lytis</label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: parseInt(e.target.value) })
                    }
                  >
                    <option value={0}>Vyras</option>
                    <option value={1}>Moteris</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Etatas</label>
                  <select
                    value={form.fullTime}
                    onChange={(e) =>
                      setForm({ ...form, fullTime: parseFloat(e.target.value) })
                    }
                  >
                    <option value={0.5}>0.5</option>
                    <option value={0.75}>0.75</option>
                    <option value={1.0}>1.0</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowForm(false)}
                >
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  Išsaugoti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDownloadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDownloadModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Atsisiųsti Excel ataskaitą</h3>
              <button
                className="close-btn"
                onClick={() => setShowDownloadModal(false)}
              >
                ×
              </button>
            </div>
            <div className="pet-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Pradžios data</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    placeholder="Pasirinkite pradžios datą"
                  />
                </div>
                <div className="form-group">
                  <label>Pabaigos data</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    placeholder="Pasirinkite pabaigos datą"
                  />
                </div>
              </div>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
                Palikite tuščius laukus, jei norite gauti visus duomenis
              </p>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowDownloadModal(false)}
                >
                  Atšaukti
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleDownloadExcel}
                >
                  Atsisiųsti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWorkdayModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowWorkdayModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Pridėti darbo laiką - {selectedVetForWorkday?.name}{" "}
                {selectedVetForWorkday?.surname}
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowWorkdayModal(false)}
              >
                ×
              </button>
            </div>
            <form className="pet-form" onSubmit={saveWorkday}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Data*</label>
                  <input
                    type="date"
                    required
                    value={workdayForm.date}
                    onChange={(e) =>
                      setWorkdayForm({ ...workdayForm, date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Darbo pradžia (valanda)*</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    required
                    value={workdayForm.startHour}
                    onChange={(e) =>
                      setWorkdayForm({
                        ...workdayForm,
                        startHour: e.target.value,
                      })
                    }
                    placeholder="8"
                  />
                </div>
                <div className="form-group">
                  <label>Darbo pabaiga (valanda)*</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    required
                    value={workdayForm.endHour}
                    onChange={(e) =>
                      setWorkdayForm({
                        ...workdayForm,
                        endHour: e.target.value,
                      })
                    }
                    placeholder="18"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowWorkdayModal(false)}
                >
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  Išsaugoti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVets;
