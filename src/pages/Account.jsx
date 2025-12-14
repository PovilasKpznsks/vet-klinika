import { useState, useEffect } from "react";
import userService from "../services/userService";
import petsService from "../services/petsService";
import { notificationService } from "../services/notificationService";
import "../styles/Account.css";

const Account = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userData, setUserData] = useState({
    // Asmeninė informacija
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",

    // Sveikatos duomenys
    bloodType: "",
    allergies: "",
    chronicDiseases: "",
    medications: "",
    emergencyContact: "",
    emergencyPhone: "",

    // Sistemos nustatymai
    notifications: true,
    language: "lt",
    theme: "light",
  });

  const [healthStats, setHealthStats] = useState({
    totalVisits: 0,
    upcomingVisits: 0,
    activePrescriptions: 0,
    healthAlerts: 0,
  });

  const [pets, setPets] = useState([]);
  const [showPetForm, setShowPetForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [newPet, setNewPet] = useState({
    vardas: "",
    rusis: "",
    klase: "",
    gimimo_data: "",
    spalva: "",
    svoris: "",
    mikrocipo_numeris: "",
  });

  // Duomenų įkėlimas iš API
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Naudoti pagerintą userService su automatiniais pranešimais
      const [profileResult, statsResult, petsResult] = await Promise.all([
        userService.getProfile(false), // Nereikia sėkmės pranešimo įkėlimui
        userService.getHealthStats(),
        petsService.getPets(false),
      ]);

      if (profileResult.success) {
        setUserData(profileResult.data || getMockUserData());
      } else {
        // Fallback į mock duomenis jei API nepasiekiamas
        setUserData(getMockUserData());
      }

      if (statsResult.success) {
        setHealthStats(statsResult.data || getMockHealthStats());
      } else {
        setHealthStats(getMockHealthStats());
      }

      if (petsResult.success) {
        setPets(petsResult.data || getMockPets());
      } else {
        setPets(getMockPets());
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      notificationService.addError("Nepavyko įkelti vartotojo duomenų");

      // Fallback į mock duomenis
      setUserData(getMockUserData());
      setHealthStats(getMockHealthStats());
      setPets(getMockPets());
    } finally {
      setLoading(false);
    }
  };

  // Mock duomenys kaip atsarginė kopija
  const getMockUserData = () => ({
    firstName: "Jonas",
    lastName: "Jonaitis",
    personalCode: "38001010000",
    email: "jonas.jonaitis@email.com",
    phone: "+370 600 00000",
    address: "Vilniaus g. 1, Vilnius",
    birthDate: "1980-01-01",
    bloodType: "A+",
    allergies: "Žiedadulkės",
    chronicDiseases: "",
    medications: "",
    emergencyContact: "Ona Jonaitienė",
    emergencyPhone: "+370 600 00001",
    notifications: true,
    language: "lt",
    theme: "light",
  });

  const getMockHealthStats = () => ({
    totalVisits: 15,
    upcomingVisits: 2,
    activePrescriptions: 1,
    healthAlerts: 0,
  });

  const getMockPets = () => [
    {
      id: 1,
      vardas: "Rексас",
      rusis: "Šuo",
      klase: "Žinduoliai",
      gimimo_data: "2020-05-15",
      spalva: "Juodas ir rudas",
      svoris: "32",
      mikrocipo_numeris: "123456789012345",
    },
    {
      id: 2,
      vardas: "Mūza",
      rusis: "Katė",
      klase: "Žinduoliai",
      gimimo_data: "2019-03-20",
      spalva: "Pilka",
      svoris: "4.5",
      mikrocipo_numeris: "987654321098765",
    },
  ];

  const handleSave = async () => {
    try {
      setLoading(true);

      // Naudoti pagerintą userService su automatiniais pranešimais
      const result = await userService.updateProfile(userData);

      if (result.success) {
        setIsEditing(false);
        // Pranešimas jau bus parodytas automatiškai per userService
      }
    } catch (error) {
      console.error("Klaida saugant duomenis:", error);
      // Klaidos pranešimas jau bus parodytas automatiškai
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = async () => {
    const currentPassword = prompt("Įveskite dabartinį slaptažodį:");
    if (!currentPassword) return;

    const newPassword = prompt("Įveskite naują slaptažodį:");
    if (!newPassword) return;

    const confirmPassword = prompt("Pakartokite naują slaptažodį:");
    if (newPassword !== confirmPassword) {
      notificationService.addError("Slaptažodžiai nesutampa");
      return;
    }

    const result = await userService.changePassword({
      currentPassword,
      newPassword,
    });

    // Pranešimas bus parodytas automatiškai per userService
  };

  const handleDeleteAccount = async () => {
    const result = await userService.deleteAccount();

    if (result.success) {
      // Nukreipti į prisijungimo puslapį
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleExportData = async () => {
    await userService.exportUserData();
    // Pranešimas bus parodytas automatiškai per userService
  };

  // Gyvūnų valdymo funkcijos
  const handlePetInputChange = (field, value) => {
    setNewPet((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddPet = () => {
    setEditingPet(null);
    setNewPet({
      vardas: "",
      rusis: "",
      klase: "",
      gimimo_data: "",
      spalva: "",
      svoris: "",
      mikrocipo_numeris: "",
    });
    setShowPetForm(true);
  };

  const handleEditPet = (pet) => {
    setEditingPet(pet.id);
    setNewPet({
      vardas: pet.vardas,
      rusis: pet.rusis,
      klase: pet.klase,
      gimimo_data: pet.gimimo_data,
      spalva: pet.spalva,
      svoris: pet.svoris,
      mikrocipo_numeris: pet.mikrocipo_numeris,
    });
    setShowPetForm(true);
  };

  const handleSavePet = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingPet) {
        // Atnaujinti esamą gyvūną
        const result = await petsService.updatePet(editingPet, newPet);
        if (result.success) {
          setPets(
            pets.map((p) =>
              p.id === editingPet ? { ...newPet, id: editingPet } : p
            )
          );
          setShowPetForm(false);
          setEditingPet(null);
        }
      } else {
        // Pridėti naują gyvūną
        const result = await petsService.addPet(newPet);
        if (result.success) {
          const newPetData = result.data || { ...newPet, id: pets.length + 1 };
          setPets([...pets, newPetData]);
          setShowPetForm(false);
        }
      }

      setNewPet({
        name: "",
        species: "",
        breed: "",
        birthDate: "",
        gender: "",
        color: "",
        weight: "",
        microchipNumber: "",
        notes: "",
      });
    } catch (error) {
      console.error("Klaida saugant gyvūną:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePet = async (petId) => {
    if (!confirm("Ar tikrai norite pašalinti šį gyvūną iš sąrašo?")) {
      return;
    }

    try {
      setLoading(true);
      const result = await petsService.deletePet(petId);

      if (result.success) {
        setPets(pets.filter((p) => p.id !== petId));
      }
    } catch (error) {
      console.error("Klaida trinant gyvūną:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (gimimo_data) => {
    if (!gimimo_data) return "Nežinomas";
    const today = new Date();
    const birth = new Date(gimimo_data);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    if (age === 0) {
      const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;
      return `${months} mėn.`;
    }

    return `${age} m.`;
  };

  const renderProfileTab = () => (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">
          <span>
            {userData.firstName.charAt(0)}
            {userData.lastName.charAt(0)}
          </span>
        </div>
        <div className="profile-info">
          <h3>
            {userData.firstName} {userData.lastName}
          </h3>
          <p>{userData.email}</p>
        </div>
        <button
          className={`edit-btn ${isEditing ? "save" : "edit"}`}
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={loading}
        >
          {loading ? "Kraunama..." : isEditing ? "Išsaugoti" : "Redaguoti"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="profile-form">
        <div className="form-section">
          <h4>Asmeninė informacija</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Vardas</label>
              <input
                type="text"
                value={userData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Pavardė</label>
              <input
                type="text"
                value={userData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Gimimo data</label>
              <input
                type="date"
                value={userData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>El. paštas</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Telefono numeris</label>
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group full-width">
              <label>Adresas</label>
              <input
                type="text"
                value={userData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPetsTab = () => (
    <div className="pets-section">
      <div className="pets-header">
        <h3>Mano gyvūnai</h3>
        <button
          className="btn primary"
          onClick={handleAddPet}
          disabled={loading}
        >
          + Pridėti gyvūną
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="empty-state">
          <p>Dar neturite užregistruotų gyvūnų</p>
          <p>Pridėkite savo augintinį, kad galėtumėte registruoti vizitus</p>
        </div>
      ) : (
        <div className="pets-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="pet-card">
              <div className="pet-card-header">
                <div className="pet-avatar">
                  {pet.species === "Šuo"
                    ? "🐕"
                    : pet.species === "Katė"
                    ? "🐈"
                    : "🐾"}
                </div>
                <div className="pet-info">
                  <h4>{pet.vardas}</h4>
                  <p>
                    {pet.rusis} • {pet.klase}
                  </p>
                </div>
              </div>

              <div className="pet-details">
                <div className="detail-row">
                  <span className="label">Amžius:</span>
                  <span>{calculateAge(pet.gimimo_data)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Klasė:</span>
                  <span>{pet.klase}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Spalva:</span>
                  <span>{pet.spalva}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Svoris:</span>
                  <span>{pet.svoris} kg</span>
                </div>
                {pet.mikrocipo_numeris && (
                  <div className="detail-row">
                    <span className="label">Mikroschemos nr.:</span>
                    <span className="microchip">{pet.mikrocipo_numeris}</span>
                  </div>
                )}
              </div>

              <div className="pet-actions">
                <button
                  className="btn secondary small"
                  onClick={() => handleEditPet(pet)}
                  disabled={loading}
                >
                  Redaguoti
                </button>
                <button
                  className="btn danger small"
                  onClick={() => handleDeletePet(pet.id)}
                  disabled={loading}
                >
                  Pašalinti
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gyvūno pridėjimo/redagavimo forma */}
      {showPetForm && (
        <div className="modal-overlay" onClick={() => setShowPetForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingPet ? "Redaguoti gyvūną" : "Pridėti naują gyvūną"}
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowPetForm(false)}
              >
                ×
              </button>
            </div>

            <form className="pet-form" onSubmit={handleSavePet}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vardas*</label>
                  <input
                    type="text"
                    required
                    value={newPet.vardas}
                    onChange={(e) =>
                      handlePetInputChange("vardas", e.target.value)
                    }
                    placeholder="Pvz.: Reksas"
                  />
                </div>

                <div className="form-group">
                  <label>Rūšis*</label>
                  <select
                    required
                    value={newPet.rusis}
                    onChange={(e) =>
                      handlePetInputChange("rusis", e.target.value)
                    }
                  >
                    <option value="">Pasirinkite rūšį</option>
                    <option value="Šuo">Šuo</option>
                    <option value="Katė">Katė</option>
                    <option value="Triušis">Triušis</option>
                    <option value="Jūrų kiaulytė">Jūrų kiaulytė</option>
                    <option value="Šeškas">Šeškas</option>
                    <option value="Paukštis">Paukštis</option>
                    <option value="Kita">Kita</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Klasė*</label>
                  <select
                    required
                    value={newPet.klase}
                    onChange={(e) =>
                      handlePetInputChange("klase", e.target.value)
                    }
                  >
                    <option value="">Pasirinkite klasę</option>
                    <option value="Žinduoliai">Žinduoliai</option>
                    <option value="Paukščiai">Paukščiai</option>
                    <option value="Ropliai">Ropliai</option>
                    <option value="Žuvys">Žuvys</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Gimimo data*</label>
                  <input
                    type="date"
                    required
                    value={newPet.gimimo_data}
                    onChange={(e) =>
                      handlePetInputChange("gimimo_data", e.target.value)
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Spalva</label>
                  <input
                    type="text"
                    value={newPet.spalva}
                    onChange={(e) =>
                      handlePetInputChange("spalva", e.target.value)
                    }
                    placeholder="Pvz.: Juodas ir rudas"
                  />
                </div>

                <div className="form-group">
                  <label>Svoris (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPet.svoris}
                    onChange={(e) =>
                      handlePetInputChange("svoris", e.target.value)
                    }
                    placeholder="Pvz.: 25.5"
                  />
                </div>

                <div className="form-group">
                  <label>Mikroschemos numeris</label>
                  <input
                    type="text"
                    value={newPet.mikrocipo_numeris}
                    onChange={(e) =>
                      handlePetInputChange("mikrocipo_numeris", e.target.value)
                    }
                    placeholder="15 skaitmenų"
                    maxLength="15"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowPetForm(false)}
                  disabled={loading}
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={loading}
                >
                  {loading
                    ? "Saugoma..."
                    : editingPet
                    ? "Išsaugoti"
                    : "Pridėti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderHealthTab = () => (
    <div className="health-section">
      <div className="health-stats">
        <div className="stat-card">
          <h4>Vizitai</h4>
          <span className="stat-number">
            {loading ? "..." : healthStats.totalVisits}
          </span>
          <p>Iš viso</p>
        </div>
        <div className="stat-card">
          <h4>Būsimi vizitai</h4>
          <span className="stat-number">
            {loading ? "..." : healthStats.upcomingVisits}
          </span>
          <p>Suplanuoti</p>
        </div>
        <div className="stat-card">
          <h4>Receptai</h4>
          <span className="stat-number">
            {loading ? "..." : healthStats.activePrescriptions}
          </span>
          <p>Aktyvūs</p>
        </div>
        <div className="stat-card">
          <h4>Perspėjimai</h4>
          <span className="stat-number">
            {loading ? "..." : healthStats.healthAlerts}
          </span>
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
              onChange={(e) => handleInputChange("bloodType", e.target.value)}
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
              onChange={(e) => handleInputChange("allergies", e.target.value)}
              disabled={!isEditing || loading}
              placeholder="Pvz.: žiedadulkės, vaistai"
            />
          </div>
          <div className="form-group full-width">
            <label>Lėtinės ligos</label>
            <textarea
              value={userData.chronicDiseases}
              onChange={(e) =>
                handleInputChange("chronicDiseases", e.target.value)
              }
              disabled={!isEditing || loading}
              rows="3"
              placeholder="Aprašykite lėtines ligas ar būkles"
            />
          </div>
          <div className="form-group full-width">
            <label>Nuolat vartojami vaistai</label>
            <textarea
              value={userData.medications}
              onChange={(e) => handleInputChange("medications", e.target.value)}
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
              onChange={(e) =>
                handleInputChange("emergencyContact", e.target.value)
              }
              disabled={!isEditing || loading}
            />
          </div>
          <div className="form-group">
            <label>Kontaktinio asmens telefonas</label>
            <input
              type="tel"
              value={userData.emergencyPhone}
              onChange={(e) =>
                handleInputChange("emergencyPhone", e.target.value)
              }
              disabled={!isEditing || loading}
            />
          </div>
        </div>
      </div>
    </div>
  );

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
                onChange={(e) =>
                  handleInputChange("notifications", e.target.checked)
                }
                disabled={!isEditing || loading}
              />
              Gauti el. pašto pranešimus
            </label>
          </div>
          <div className="setting-item">
            <label>Kalba</label>
            <select
              value={userData.language}
              onChange={(e) => handleInputChange("language", e.target.value)}
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
              onChange={(e) => handleInputChange("theme", e.target.value)}
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
  );

  if (loading && !userData.firstName) {
    return (
      <div className="account-page">
        <div className="loading-spinner">
          <p>Kraunami duomenys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="account-header">
        <h2>Paskyros valdymas</h2>
        <p>Tvarkykite savo asmeninę informaciją ir sistemos nustatymus</p>
      </div>

      <div className="account-tabs">
        <button
          className={`tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
          disabled={loading}
        >
          Profilis
        </button>
        <button
          className={`tab ${activeTab === "pets" ? "active" : ""}`}
          onClick={() => setActiveTab("pets")}
          disabled={loading}
        >
          Gyvūnai
        </button>
        <button
          className={`tab ${activeTab === "health" ? "active" : ""}`}
          onClick={() => setActiveTab("health")}
          disabled={loading}
        >
          Sveikatos duomenys
        </button>
        <button
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
          disabled={loading}
        >
          Nustatymai
        </button>
      </div>

      <div className="account-content">
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "pets" && renderPetsTab()}
        {activeTab === "health" && renderHealthTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>
    </div>
  );
};

export default Account;
