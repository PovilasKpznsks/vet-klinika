import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import diseasesService from "../services/diseasesService";
import "../styles/Diseases.css";

const Diseases = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 0;
  const [diseases, setDiseases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDiseases, setUserDiseases] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    ligos_pavadinimas: "",
    liga_kategorija: "",
    ligos_aprasymas: "",
  });

  const categories = [
    { value: "all", label: "Visos kategorijos" },
    { value: "cardiovascular", label: "Širdies ir kraujagyslių ligos" },
    { value: "respiratory", label: "Kvėpavimo sistemos ligos" },
    { value: "digestive", label: "Virškinimo sistemos ligos" },
    { value: "neurological", label: "Nervų sistemos ligos" },
    { value: "endocrine", label: "Endokrininės sistemos ligos" },
    { value: "infectious", label: "Infekcinės ligos" },
    { value: "dermatological", label: "Odos ligos" },
    { value: "oncological", label: "Onkologinės ligos" },
  ];

  useEffect(() => {
    loadDiseases();
    loadUserDiseases();
  }, []);

  const loadDiseases = async () => {
    try {
      setLoading(true);
      const data = await diseasesService
        .getDiseases()
        .catch(() => getMockDiseases());
      setDiseases(data);
    } catch (error) {
      console.error("Klaida įkeliant ligų duomenis:", error);
      setDiseases(getMockDiseases());
    } finally {
      setLoading(false);
    }
  };

  const loadUserDiseases = async () => {
    try {
      const data = await diseasesService.getUserDiseases().catch(() => []);
      setUserDiseases(data);
    } catch (error) {
      console.error("Klaida įkeliant vartotojo ligų duomenis:", error);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      ligos_pavadinimas: "",
      liga_kategorija: "",
      ligos_aprasymas: "",
    });
    setShowForm(true);
  };

  const startEdit = (disease) => {
    setEditingId(disease.id);
    setForm({
      ligos_pavadinimas: disease.ligos_pavadinimas || disease.name || "",
      liga_kategorija: disease.liga_kategorija || disease.category || "",
      ligos_aprasymas: disease.ligos_aprasymas || disease.description || "",
    });
    setShowForm(true);
    setSelectedDisease(null);
  };

  const saveDisease = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (editingId) {
        const res = await diseasesService.updateDiseaseRecord(editingId, data);
        if (res.success || true) {
          setDiseases(
            diseases.map((d) =>
              d.id === editingId ? { ...data, id: editingId } : d
            )
          );
        }
      } else {
        const res = await diseasesService.addDiseaseRecord(data);
        const created = res.success
          ? res.data || {
              ...data,
              id: (diseases[diseases.length - 1]?.id || 0) + 1,
            }
          : { ...data, id: (diseases[diseases.length - 1]?.id || 0) + 1 };
        setDiseases([...diseases, created]);
      }
      setShowForm(false);
      setForm({
        ligos_pavadinimas: "",
        liga_kategorija: "",
        ligos_aprasymas: "",
      });
    } catch (err) {
      console.error("Error saving disease:", err);
    }
  };

  const deleteDisease = async (id) => {
    if (!window.confirm("Pašalinti ligą?")) return;
    try {
      const res = await diseasesService.deleteDiseaseRecord(id);
      if (res.success || true) setDiseases(diseases.filter((d) => d.id !== id));
      setSelectedDisease(null);
    } catch (err) {
      console.error("Error deleting disease:", err);
    }
  };

  const getMockDiseases = () => [
    {
      id: 1,
      ligos_pavadinimas: "Arterinė hipertenzija",
      liga_kategorija: "cardiovascular",
      ligos_aprasymas: "Padidėjęs arterinis kraujospūdis",
    },
    {
      id: 2,
      ligos_pavadinimas: "Bronchų astma",
      liga_kategorija: "respiratory",
      ligos_aprasymas: "Lėtinis kvėpavimo takų uždegimas",
    },
    {
      id: 3,
      ligos_pavadinimas: "Diabetas",
      liga_kategorija: "endocrine",
      ligos_aprasymas: "Gliukozės metabolizmo sutrikimas",
    },
    {
      id: 4,
      ligos_pavadinimas: "Gastritas",
      liga_kategorija: "digestive",
      ligos_aprasymas: "Skrandžio gleivinės uždegimas",
    },
    {
      id: 5,
      ligos_pavadinimas: "Migrena",
      liga_kategorija: "neurological",
      ligos_aprasymas: "Lėtinis neurologinis sutrikimas",
    },
  ];

  const filteredDiseases = diseases.filter((disease) => {
    const name = disease.ligos_pavadinimas || disease.name || "";
    const desc = disease.ligos_aprasymas || disease.description || "";
    const cat = disease.liga_kategorija || disease.category || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || cat === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToUserDiseases = async (disease) => {
    try {
      await diseasesService.addDiseaseRecord({
        diseaseId: disease.id,
        diagnosisDate: new Date().toISOString(),
        status: "active",
      });
      setUserDiseases([...userDiseases, disease]);
      alert("Liga pridėta į jūsų sveikatos istoriją");
    } catch (error) {
      console.error("Klaida pridedant ligą:", error);
    }
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
        {isAdmin && (
          <button
            className="btn primary"
            onClick={startCreate}
            style={{ marginTop: "1rem" }}
          >
            + Pridėti ligą
          </button>
        )}
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
                <h3>{disease.ligos_pavadinimas || disease.name}</h3>
              </div>

              <p className="disease-description">
                {disease.ligos_aprasymas || disease.description}
              </p>

              <div className="disease-category">
                <span className="category-label">
                  {
                    categories.find(
                      (c) =>
                        c.value ===
                        (disease.liga_kategorija || disease.category)
                    )?.label
                  }
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

      {userDiseases.length > 0 && (
        <div className="user-diseases-section">
          <h3>Jūsų sveikatos istorija</h3>
          <div className="user-diseases-list">
            {userDiseases.map((disease) => (
              <div key={disease.id} className="user-disease-item">
                <span>{disease.name}</span>
                <span className="diagnosis-date">
                  Diagnozė: {new Date().toLocaleDateString("lt-LT")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <label>Ligos pavadinimas*</label>
                  <input
                    required
                    value={form.ligos_pavadinimas}
                    onChange={(e) =>
                      setForm({ ...form, ligos_pavadinimas: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Liga kategorija*</label>
                  <select
                    required
                    value={form.liga_kategorija}
                    onChange={(e) =>
                      setForm({ ...form, liga_kategorija: e.target.value })
                    }
                  >
                    <option value="">Pasirinkite</option>
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
                    value={form.ligos_aprasymas}
                    onChange={(e) =>
                      setForm({ ...form, ligos_aprasymas: e.target.value })
                    }
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
    </div>
  );
};

export default Diseases;
