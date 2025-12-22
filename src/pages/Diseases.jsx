import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import diseasesService from "../services/diseasesService";
import { notificationService } from "../services/notificationService";
import "../styles/Diseases.css";

// Role types: 0 = Administrator, 1 = Veterinarian, 2 = Client
const ROLE_TYPES = {
  Administrator: 0,
  Veterinarian: 1,
  Client: 2,
};

const Diseases = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLE_TYPES.Administrator;
  const [diseases, setDiseases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    latinName: "",
    category: 0,
    description: "",
  });

  // Symptoms recommendation modal state
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomMatches, setSymptomMatches] = useState(null);
  const [searchingSymptoms, setSearchingSymptoms] = useState(false);

  const availableSymptoms = [
    "skausmas",
    "karščiavimas",
    "silpnumas",
    "nuovargis",
    "galvos skausmas",
    "galvos svaigimas",
    "pykinimas",
    "vėmimas",
    "viduriavimas",
    "dusulys",
    "kosulys",
    "širdies plakimas",
    "pilvo skausmas",
    "drebulys",
    "patinimas",
  ];

  const categories = [
    { value: "all", label: "Visos kategorijos" },
    { value: 0, label: "Infekcija (Infection)" },
    { value: 1, label: "Ne infekcija (Not_Infection)" },
    { value: 2, label: "Genetinė (Genetic)" },
    { value: 3, label: "Elgesio (Behavioral)" },
    { value: 4, label: "Organų sistemos (Organ_system)" },
  ];

  useEffect(() => {
    loadDiseases();
  }, []);

  const loadDiseases = async () => {
    try {
      setLoading(true);
      const data = await diseasesService.getDiseases();
      setDiseases(data);
    } catch (error) {
      console.error("Klaida įkeliant ligų duomenis:", error);
      setDiseases([]);
      notificationService.addError(
        `Nepavyko įkelti ligų duomenų: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      latinName: "",
      category: 0,
      description: "",
    });
    setShowForm(true);
  };

  const startEdit = (disease) => {
    setEditingId(disease.id);
    setForm({
      name: disease.name,
      latinName: disease.latinName || "",
      category: disease.category || 0,
      description: disease.description,
    });
    setShowForm(true);
    setSelectedDisease(null);
  };

  const saveDisease = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: form.name,
        latinName: form.latinName,
        category: form.category,
        description: form.description,
      };

      if (editingId) {
        const updated = await diseasesService.updateDiseaseRecord(
          editingId,
          data
        );
        // Reload all diseases to ensure consistency
        const allDiseases = await diseasesService.getDiseases();
        setDiseases(allDiseases);
        notificationService.addSuccess("Liga sėkmingai atnaujinta!");
      } else {
        const created = await diseasesService.addDiseaseRecord(data);
        setDiseases([...diseases, created]);
        notificationService.addSuccess("Liga sėkmingai pridėta!");
      }

      setShowForm(false);
      setEditingId(null);
      setForm({
        name: "",
        latinName: "",
        category: 0,
        description: "",
      });
    } catch (err) {
      console.error("Error saving disease:", err);
      notificationService.addError(`Klaida išsaugant ligą: ${err.message}`);
    }
  };

  const deleteDisease = async (id) => {
    if (!window.confirm("Ar tikrai norite pašalinti šią ligą?")) return;
    try {
      await diseasesService.deleteDiseaseRecord(id);
      setDiseases(diseases.filter((d) => d.id !== id));
      setSelectedDisease(null);
      notificationService.addSuccess("Liga sėkmingai pašalinta!");
    } catch (err) {
      console.error("Error deleting disease:", err);
      notificationService.addError(`Klaida šalinant ligą: ${err.message}`);
    }
  };

  // Symptom modal handlers
  const openSymptomsModal = () => {
    setShowSymptomsModal(true);
    setSelectedSymptoms([]);
    setSymptomMatches(null);
  };

  const closeSymptomsModal = () => {
    setShowSymptomsModal(false);
    setSelectedSymptoms([]);
    setSymptomMatches(null);
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const searchBySymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      notificationService.addWarning("Pasirinkite bent vieną simptomą");
      return;
    }

    try {
      setSearchingSymptoms(true);
      const result = await diseasesService.findDiseasesBySymptoms(
        selectedSymptoms
      );
      setSymptomMatches(result);

      if (result.matches && result.matches.length === 0) {
        notificationService.addInfo("Ligų pagal pasirinktus simptomus nerasta");
      }
    } catch (err) {
      console.error("Error searching diseases by symptoms:", err);
      notificationService.addError(`Klaida ieškant ligų: ${err.message}`);
    } finally {
      setSearchingSymptoms(false);
    }
  };

  const filteredDiseases = diseases.filter((disease) => {
    const matchesSearch =
      disease.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disease.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || disease.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : "Nežinoma";
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "#28a745";
      case "moderate":
        return "#ffc107";
      case "high":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case "low":
        return "Lengva";
      case "moderate":
        return "Vidutinė";
      case "high":
        return "Sunki";
      default:
        return "Nežinoma";
    }
  };

  if (loading) {
    return (
      <div className="diseases-page">
        <div className="loading-spinner">Kraunami duomenys...</div>
      </div>
    );
  }

  return (
    <div className="diseases-page">
      <div className="diseases-header">
        <h2>Ligų duomenų bazė</h2>
        <p>Ieškokite informacijos apie ligas, jų simptomus ir gydymo metodus</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          {isAdmin && (
            <button className="btn primary" onClick={startCreate}>
              + Pridėti ligą
            </button>
          )}
          <button className="btn secondary" onClick={openSymptomsModal}>
            Atidaryti ligos rekomendacijos langą
          </button>
        </div>
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
            onChange={(e) =>
              setSelectedCategory(
                e.target.value === "all" ? "all" : parseInt(e.target.value)
              )
            }
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="diseases-content">
        <div className="diseases-grid">
          {filteredDiseases.map((disease) => (
            <div key={disease.id} className="disease-card">
              <div className="disease-header">
                <h3>{disease.name}</h3>
                {disease.latinName && (
                  <p className="latin-name">{disease.latinName}</p>
                )}
              </div>

              <p className="disease-description">{disease.description}</p>

              <div className="disease-category">
                <span className="category-label">
                  {getCategoryLabel(disease.category)}
                </span>
              </div>

              <div className="disease-actions">
                <button
                  className="btn primary"
                  onClick={() => setSelectedDisease(disease)}
                >
                  Peržiūrėti
                </button>
                {isAdmin && (
                  <>
                    <button
                      className="btn secondary"
                      onClick={() => startEdit(disease)}
                    >
                      Redaguoti
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => deleteDisease(disease.id)}
                    >
                      Šalinti
                    </button>
                  </>
                )}
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

      {selectedDisease && (
        <div
          className="disease-modal-overlay"
          onClick={() => setSelectedDisease(null)}
        >
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
                      style={{
                        color: getSeverityColor(selectedDisease.severity),
                      }}
                    >
                      {getSeverityLabel(selectedDisease.severity)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Kategorija:</span>
                    <span className="meta-value">
                      {
                        categories.find(
                          (c) => c.value === selectedDisease.category
                        )?.label
                      }
                    </span>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div
                  className="modal-actions"
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "flex-end",
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "2px solid #e9ecef",
                  }}
                >
                  <button
                    className="btn secondary"
                    onClick={() => startEdit(selectedDisease)}
                  >
                    Redaguoti
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => deleteDisease(selectedDisease.id)}
                  >
                    Šalinti
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin forma */}
      {showForm && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Redaguoti ligą" : "Pridėti ligą"}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <form className="pet-form" onSubmit={saveDisease}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Liga lotyniškai*</label>
                  <input
                    required
                    value={form.latinName}
                    onChange={(e) =>
                      setForm({ ...form, latinName: e.target.value })
                    }
                    placeholder="Pvz.: Diabetes mellitus"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Ligos pavadinimas*</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Pvz.: Diabetas"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Ligos kategorija*</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: parseInt(e.target.value) })
                    }
                  >
                    {categories
                      .filter((c) => c.value !== "all")
                      .map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Ligos aprašymas*</label>
                  <textarea
                    required
                    rows="4"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Ligos aprašymas, požymiai ir ypatumai"
                  />
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

      {/* Symptoms recommendation modal */}
      {showSymptomsModal && (
        <div className="modal-overlay" onClick={closeSymptomsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ligų paieška pagal simptomus</h2>
              <button className="close-btn" onClick={closeSymptomsModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {!symptomMatches ? (
                <>
                  <p style={{ marginBottom: "1.5rem" }}>
                    Pasirinkite simptomus, kurie pasireiškia:
                  </p>

                  <div className="symptoms-grid">
                    {availableSymptoms.map((symptom) => (
                      <label key={symptom} className="symptom-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSymptoms.includes(symptom)}
                          onChange={() => toggleSymptom(symptom)}
                        />
                        <span>{symptom}</span>
                      </label>
                    ))}
                  </div>

                  <div className="selected-count">
                    Pasirinkta simptomų: {selectedSymptoms.length}
                  </div>

                  <div className="modal-actions">
                    <button
                      className="btn secondary"
                      onClick={closeSymptomsModal}
                    >
                      Atšaukti
                    </button>
                    <button
                      className="btn primary"
                      onClick={searchBySymptoms}
                      disabled={
                        selectedSymptoms.length === 0 || searchingSymptoms
                      }
                    >
                      {searchingSymptoms ? "Ieškoma..." : "Ieškoti ligų"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="results-header">
                    <h3>{symptomMatches.message || "Rezultatai"}</h3>
                    <button
                      className="btn secondary"
                      onClick={() => setSymptomMatches(null)}
                    >
                      ← Grįžti į paiešką
                    </button>
                  </div>

                  {symptomMatches.matches &&
                  symptomMatches.matches.length > 0 ? (
                    <div className="matches-list">
                      {symptomMatches.matches.map((match) => (
                        <div key={match.id} className="match-card">
                          <div className="match-header">
                            <h4>{match.name}</h4>
                            {match.latinName && (
                              <p className="latin-name">{match.latinName}</p>
                            )}
                          </div>

                          <p className="match-description">
                            {match.description}
                          </p>

                          <div className="match-stats">
                            <div className="stat">
                              <span className="label">Atitikimas:</span>
                              <span className="value">
                                {match.matchPercentage}%
                              </span>
                            </div>
                            <div className="stat">
                              <span className="label">
                                Sutampančių simptomų:
                              </span>
                              <span className="value">{match.matchCount}</span>
                            </div>
                            <div className="stat">
                              <span className="label">Kategorija:</span>
                              <span className="value">
                                {getCategoryLabel(match.category)}
                              </span>
                            </div>
                          </div>

                          {match.matchedSymptoms &&
                            match.matchedSymptoms.length > 0 && (
                              <div className="matched-symptoms">
                                <strong>Sutampantys simptomai:</strong>
                                <div className="symptoms-tags">
                                  {match.matchedSymptoms.map((symptom, idx) => (
                                    <span key={idx} className="symptom-tag">
                                      {symptom}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-results">
                      <p>Ligų pagal pasirinktus simptomus nerasta.</p>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      className="btn primary"
                      onClick={closeSymptomsModal}
                    >
                      Uždaryti
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diseases;
