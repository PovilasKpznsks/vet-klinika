import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import userService from "../services/userService";
import petsService from "../services/petsService";
import { notificationService } from "../services/notificationService";
import "../styles/Account.css";

const Account = () => {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === 0; // Administrator role
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
    birthDate: "",

    // Sistemos nustatymai
    notifications: true,
    language: "lt",
    theme: "light",
  });

  const [pets, setPets] = useState([]);
  const [showPetForm, setShowPetForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [expandedPetDetails, setExpandedPetDetails] = useState({});
  const [showIllnessForm, setShowIllnessForm] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showProductUsedForm, setShowProductUsedForm] = useState(false);
  const [selectedPetForRecord, setSelectedPetForRecord] = useState(null);
  const [editingIllness, setEditingIllness] = useState(null);
  const [editingVaccination, setEditingVaccination] = useState(null);
  const [editingProductUsed, setEditingProductUsed] = useState(null);
  const [newIllness, setNewIllness] = useState({
    name: "",
    description: "",
    dateDiagnosed: "",
  });
  const [diseasesList, setDiseasesList] = useState([]);
  const [newVaccination, setNewVaccination] = useState({
    name: "",
    description: "",
    dateAdministered: "",
  });
  const [productsList, setProductsList] = useState([]);
  const [newProductUsed, setNewProductUsed] = useState({
    dosage: "",
    timesPerDay: 1,
    productId: null,
  });
  const [newPet, setNewPet] = useState({
    name: "",
    breed: "",
    species: "",
    speciesLatin: "",
    class: 0, // AnimalClass enum: Mammal=0, Bird=1, Reptile=2, Amphibian=3, Fish=4
    photoUrl: "",
    dateOfBirth: "",
    weight: "",
  });
  const [petImageFile, setPetImageFile] = useState(null);
  const [petImagePreview, setPetImagePreview] = useState(null);
  const [uploadingPetImage, setUploadingPetImage] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Duomenų įkėlimas iš API
  useEffect(() => {
    loadUserData();
  }, []);

  // Inicijuoti userData su prisijungusio vartotojo duomenimis
  useEffect(() => {
    if (user) {
      setUserData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        birthDate: user.birthDate || "",
      }));
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Naudoti pagerintą userService su automatiniais pranešimais
      const [profileResult, petsResult, diseases, products] = await Promise.all(
        [
          userService.getProfile(false), // Nereikia sėkmės pranešimo įkėlimui
          userService.getMyAnimals(),
          // diseasesService fetches via absolute host
          import("../services/diseasesService").then((m) =>
            m.default.getDiseases().catch(() => [])
          ),
          import("../services/productsService").then((m) =>
            m.default.getProducts().catch(() => [])
          ),
        ]
      );

      if (
        profileResult?.success &&
        profileResult.data &&
        typeof profileResult.data === "object"
      ) {
        setUserData(profileResult.data);
      }

      if (petsResult?.success) {
        const pr = petsResult.data;

        // Normalize several possible shapes into an array
        let petsArray = [];
        if (Array.isArray(pr)) {
          petsArray = pr;
        } else if (pr && Array.isArray(pr.data)) {
          petsArray = pr.data;
        } else if (pr && typeof pr === "object") {
          // Handle case where API returned an array but apiClient spread it into an object
          const numericKeys = Object.keys(pr)
            .filter((k) => /^\d+$/.test(k))
            .sort((a, b) => +a - +b);
          if (numericKeys.length > 0) {
            petsArray = numericKeys.map((k) => pr[k]);
          }
        }

        setPets(petsArray);
      } else {
        setPets([]);
      }

      // set diseases and products (if available)
      setDiseasesList(Array.isArray(diseases) ? diseases : []);
      setProductsList(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error("Error loading user data:", error);
      notificationService.addError("Nepavyko įkelti vartotojo duomenų");
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  // Note: mock fallback removed so UI reflects backend data only

  const handleSave = async () => {
    try {
      setLoading(true);

      let photoUrl = userData.photoUrl;

      // Upload profile image if file selected
      if (profileImageFile) {
        setUploadingProfileImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", profileImageFile);

        const token = localStorage.getItem("auth_token");
        const uploadResponse = await fetch(
          "http://localhost:5068/api/Users/upload-image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Nepavyko įkelti nuotraukos");
        }

        const uploadResult = await uploadResponse.json();
        photoUrl = uploadResult.photoUrl;
        setUploadingProfileImage(false);
      }

      // Naudoti pagerintą userService su automatiniais pranešimais
      const result = await userService.updateProfile({ ...userData, photoUrl });

      if (result.success) {
        setIsEditing(false);
        setProfileImageFile(null);
        setProfileImagePreview(null);
        // Atnaujinti AuthContext su nauju photoUrl
        updateUser({ ...userData, photoUrl });
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

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notificationService.addError(
        "Naujas slaptažodis ir patvirtinimas nesutampa"
      );
      return;
    }

    if (passwordData.newPassword.length < 6) {
      notificationService.addError(
        "Naujas slaptažodis turi būti bent 6 simbolių ilgio"
      );
      return;
    }

    try {
      setLoading(true);
      const result = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.success) {
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Password change error:", error);
    } finally {
      setLoading(false);
    }
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
      name: "",
      breed: "",
      species: "",
      speciesLatin: "",
      class: 0,
      photoUrl: "",
      dateOfBirth: "",
      weight: "",
    });
    setPetImageFile(null);
    setPetImagePreview(null);
    setShowPetForm(true);
  };

  const handleEditPet = (pet) => {
    setEditingPet(pet.id);
    setNewPet({
      name: pet.name,
      breed: pet.breed,
      species: pet.species,
      speciesLatin: pet.speciesLatin,
      class: pet.class,
      photoUrl: pet.photoUrl || "",
      dateOfBirth: formatDateForInput(pet.dateOfBirth),
      weight: pet.weight,
    });
    setPetImageFile(null);
    setPetImagePreview(
      pet.photoUrl ? `http://localhost:5068${pet.photoUrl}` : null
    );
    setShowPetForm(true);
  };

  const handlePetImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        notificationService.addError(
          "Netinkamas failo tipas. Leidžiami: JPG, PNG, GIF, WEBP"
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        notificationService.addError(
          "Failas per didelis. Maksimalus dydis: 5MB"
        );
        return;
      }
      setPetImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPetImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePetImage = () => {
    setPetImageFile(null);
    setPetImagePreview(null);
    setNewPet((prev) => ({ ...prev, photoUrl: "" }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        notificationService.addError(
          "Netinkamas failo tipas. Leidžiami: JPG, PNG, GIF, WEBP"
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        notificationService.addError(
          "Failas per didelis. Maksimalus dydis: 5MB"
        );
        return;
      }
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setUserData((prev) => ({ ...prev, photoUrl: "" }));
  };

  const handleSavePet = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let photoUrl = newPet.photoUrl;

      // Upload image if file selected
      if (petImageFile) {
        setUploadingPetImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", petImageFile);

        const token = localStorage.getItem("auth_token");
        const uploadResponse = await fetch(
          "http://localhost:5068/api/Animal/upload-image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Nepavyko įkelti nuotraukos");
        }

        const uploadResult = await uploadResponse.json();
        photoUrl = uploadResult.photoUrl;
        setUploadingPetImage(false);
      }

      const petData = { ...newPet, photoUrl };

      if (editingPet) {
        // Atnaujinti esamą gyvūną
        const result = await petsService.updatePet(editingPet, petData);
        if (result.success) {
          await loadUserData();
          setShowPetForm(false);
          setEditingPet(null);
          setPetImageFile(null);
          setPetImagePreview(null);
        }
      } else {
        // Pridėti naują gyvūną
        const result = await petsService.addPet(petData);
        if (result.success) {
          await loadUserData();
          setShowPetForm(false);
          setPetImageFile(null);
          setPetImagePreview(null);
        }
      }

      setNewPet({
        name: "",
        breed: "",
        species: "",
        speciesLatin: "",
        class: 0,
        photoUrl: "",
        dateOfBirth: "",
        weight: "",
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
        await loadUserData();
      }
    } catch (error) {
      console.error("Klaida trinant gyvūną:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "Nežinomas";
    const today = new Date();
    const birth = new Date(dateOfBirth);
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

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const togglePetDetails = (petId) => {
    setExpandedPetDetails((prev) => ({
      ...prev,
      [petId]: !prev[petId],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("lt-LT");
  };

  const getVisitTypeName = (type) => {
    const types = [
      "Profilaktinis",
      "Gydymo",
      "Chirurginis",
      "Diagnostinis",
      "Reabilitacinis",
    ];
    return types[type] || "Nežinomas";
  };

  const handleAddIllness = (petId) => {
    setSelectedPetForRecord(petId);
    setEditingIllness(null);
    setNewIllness({
      name: "",
      description: "",
      dateDiagnosed: "",
    });
    setShowIllnessForm(true);
  };

  const handleSaveIllness = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const animalId = selectedPetForRecord;
        const dto = {
          Name: newIllness.name,
          Description: newIllness.description,
          DateDiagnosed: newIllness.dateDiagnosed,
          DiseaseId: newIllness.diseaseId || null,
        };
        const animalSvc = (await import("../services/animalService")).default;
        if (editingIllness) {
          await animalSvc.updateIllness(animalId, editingIllness.id, dto);
        } else {
          await animalSvc.createIllness(animalId, dto);
        }
        await loadUserData();
        notificationService.addSuccess(
          editingIllness ? "Liga atnaujinta" : "Liga sėkmingai pridėta"
        );
      } catch (err) {
        console.error(err);
      } finally {
        setShowIllnessForm(false);
        setEditingIllness(null);
        setSelectedPetForRecord(null);
      }
    })();
  };

  const handleEditIllness = (petId, illness) => {
    setSelectedPetForRecord(petId);
    setEditingIllness(illness);
    setNewIllness({
      name: illness.name || "",
      description: illness.description || "",
      dateDiagnosed:
        illness.dateDiagnosed || illness.date || illness.Date || "",
    });
    setShowIllnessForm(true);
  };

  const handleDeleteIllness = (petId, illnessId) => {
    if (!confirm("Ar tikrai norite pašalinti šį sirgimo įrašą?")) {
      return;
    }
    (async () => {
      try {
        const animalSvc = (await import("../services/animalService")).default;
        await animalSvc.deleteIllness(petId, illnessId);
        await loadUserData();
        notificationService.addSuccess("Liga pašalinta");
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const handleAddVaccination = (petId) => {
    setSelectedPetForRecord(petId);
    setEditingVaccination(null);
    setNewVaccination({
      name: "",
      description: "",
      dateAdministered: "",
    });
    setShowVaccinationForm(true);
  };

  // ProductsUsed handlers
  const handleAddProductUsed = (petId) => {
    setSelectedPetForRecord(petId);
    setEditingProductUsed(null);
    setNewProductUsed({ dosage: "", timesPerDay: 1, productId: null });
    setShowProductUsedForm(true);
  };

  const handleSaveProductUsed = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const animalId = selectedPetForRecord;
        const dto = {
          Dosage: newProductUsed.dosage,
          TimesPerDay: Number(newProductUsed.timesPerDay) || 1,
          ProductId: newProductUsed.productId || null,
        };
        const animalSvc = (await import("../services/animalService")).default;
        if (editingProductUsed) {
          await animalSvc.updateProductUsed(
            animalId,
            editingProductUsed.id,
            dto
          );
        } else {
          await animalSvc.createProductUsed(animalId, dto);
        }
        await loadUserData();
        notificationService.addSuccess(
          editingProductUsed ? "Produktas atnaujintas" : "Produktas pridėtas"
        );
      } catch (err) {
        console.error(err);
      } finally {
        setShowProductUsedForm(false);
        setEditingProductUsed(null);
        setSelectedPetForRecord(null);
      }
    })();
  };

  const handleEditProductUsed = (petId, productUsed) => {
    setSelectedPetForRecord(petId);
    setEditingProductUsed(productUsed);
    setNewProductUsed({
      dosage: productUsed.dosage || "",
      timesPerDay: productUsed.timesPerDay || 1,
      productId: productUsed.productId || null,
    });
    setShowProductUsedForm(true);
  };

  const handleDeleteProductUsed = (petId, productUsedId) => {
    if (!confirm("Ar tikrai norite pašalinti šį įrašą?")) return;
    (async () => {
      try {
        const animalSvc = (await import("../services/animalService")).default;
        await animalSvc.deleteProductUsed(petId, productUsedId);
        await loadUserData();
        notificationService.addSuccess("Įrašas pašalintas");
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const handleSaveVaccination = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const animalId = selectedPetForRecord;
        const dto = {
          Name: newVaccination.name,
          Description: newVaccination.description,
          Date: newVaccination.dateAdministered,
          Manufacturer: newVaccination.manufacturer || null,
        };
        const animalSvc = (await import("../services/animalService")).default;
        if (editingVaccination) {
          await animalSvc.updateVaccine(animalId, editingVaccination.id, dto);
        } else {
          await animalSvc.createVaccine(animalId, dto);
        }
        await loadUserData();
        notificationService.addSuccess(
          editingVaccination
            ? "Skiepas atnaujintas"
            : "Skiepas sėkmingai pridėtas"
        );
      } catch (err) {
        console.error(err);
      } finally {
        setShowVaccinationForm(false);
        setNewVaccination({ name: "", description: "", dateAdministered: "" });
        setSelectedPetForRecord(null);
        setEditingVaccination(null);
      }
    })();
  };

  const handleEditVaccination = (petId, vaccination) => {
    setSelectedPetForRecord(petId);
    setEditingVaccination(vaccination);
    setNewVaccination({
      name: vaccination.name || "",
      description: vaccination.description || "",
      dateAdministered:
        vaccination.dateAdministered ||
        vaccination.date ||
        vaccination.Date ||
        "",
      manufacturer: vaccination.manufacturer || vaccination.Manufacturer || "",
    });
    setShowVaccinationForm(true);
  };

  const handleDeleteVaccination = (petId, vaccinationId) => {
    if (!confirm("Ar tikrai norite pašalinti šį skiepo įrašą?")) {
      return;
    }
    (async () => {
      try {
        const animalSvc = (await import("../services/animalService")).default;
        await animalSvc.deleteVaccine(petId, vaccinationId);
        await loadUserData();
        notificationService.addSuccess("Skiepas pašalintas");
      } catch (err) {
        console.error(err);
      }
    })();
  };

  // Loading state
  if (loading && !userData.firstName) {
    return (
      <div className="account-page">
        <div className="loading-spinner">
          <p>Kraunami duomenys...</p>
        </div>
      </div>
    );
  }

  const renderProfileTab = () => (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">
          {userData.photoUrl ? (
            <img
              src={`http://localhost:5068${userData.photoUrl}`}
              alt="Profile"
              className="profile-avatar-img"
            />
          ) : (
            <span>
              {(userData.firstName || "").charAt
                ? (userData.firstName || "").charAt(0)
                : ""}
              {(userData.lastName || "").charAt
                ? (userData.lastName || "").charAt(0)
                : ""}
            </span>
          )}
        </div>
        <div className="profile-info">
          <h3>
            {userData.firstName || userData.name || "Vardas"}{" "}
            {userData.lastName || userData.surname || ""}
          </h3>
          <p>{userData.email || userData.userName || ""}</p>
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
                value={userData.firstName || userData.name || ""}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Pavardė</label>
              <input
                type="text"
                value={userData.lastName || userData.surname || ""}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>

            <div className="form-group">
              <label>El. paštas</label>
              <input
                type="email"
                value={userData.email || userData.userName || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label>Telefono numeris</label>
              <input
                type="tel"
                value={userData.phone || userData.phoneNumber || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Profilio nuotrauka</h4>
          <div
            className="image-upload-container"
            style={{
              opacity: isEditing ? 1 : 0.6,
              pointerEvents: isEditing ? "auto" : "none",
            }}
            onClick={() =>
              isEditing &&
              document.getElementById("profile-image-input").click()
            }
          >
            {profileImagePreview || userData.photoUrl ? (
              <div className="image-preview-wrapper">
                <img
                  src={
                    profileImagePreview ||
                    `http://localhost:5068${userData.photoUrl}`
                  }
                  alt="Profile preview"
                  className="image-preview"
                />
                {isEditing && (
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProfileImage();
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <div className="image-upload-placeholder">
                <span>👤</span>
                <p>📁 Spauskite, kad įkeltumėte nuotrauką</p>
              </div>
            )}
            {isEditing && (
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="image-upload-input"
                style={{ display: "none" }}
              />
            )}
          </div>
          {uploadingProfileImage && (
            <p className="uploading-text">Įkeliama...</p>
          )}
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
                  {pet.photoUrl ? (
                    <img
                      src={`http://localhost:5068${pet.photoUrl}`}
                      alt={pet.name}
                      className="pet-avatar-img"
                    />
                  ) : pet.species === "Šuo" ? (
                    "🐕"
                  ) : pet.species === "Katė" ? (
                    "🐈"
                  ) : (
                    "🐾"
                  )}
                </div>
                <div className="pet-info">
                  <h4>{pet.name}</h4>
                  <p>
                    {pet.species} • {pet.breed}
                  </p>
                </div>
              </div>

              <div className="pet-details">
                <div className="detail-row">
                  <span className="label">Amžius:</span>
                  <span>{calculateAge(pet.dateOfBirth)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Klasė:</span>
                  <span>
                    {
                      [
                        "Žinduoliai",
                        "Paukščiai",
                        "Ropliai",
                        "Varliagyviai",
                        "Žuvys",
                      ][pet.class]
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Veislė:</span>
                  <span>{pet.breed}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Svoris:</span>
                  <span>{pet.weight} kg</span>
                </div>
                {pet.speciesLatin && (
                  <div className="detail-row">
                    <span className="label">Lotyn. pavadinimas:</span>
                    <span className="species-latin">{pet.speciesLatin}</span>
                  </div>
                )}
              </div>

              <div className="pet-actions">
                <button
                  className="btn secondary small"
                  onClick={() => togglePetDetails(pet.id)}
                >
                  {expandedPetDetails[pet.id]
                    ? "Slėpti detales"
                    : "Rodyti detales"}
                </button>
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

              {/* Išplėsta informacija - sirgimų istorija ir skiepai */}
              {expandedPetDetails[pet.id] && (
                <div className="pet-expanded-details">
                  <div className="pet-section">
                    <div className="section-header">
                      <h5>🩺 Sirgimų istorija</h5>
                      <button
                        className="btn primary small"
                        onClick={() => handleAddIllness(pet.id)}
                      >
                        + Pridėti sirgimą
                      </button>
                    </div>
                    {pet.illnesses && pet.illnesses.length > 0 ? (
                      <div className="illnesses-list">
                        {pet.illnesses.map((illness) => (
                          <div key={illness.id} className="illness-item">
                            <div className="illness-header">
                              <strong>{illness.name || "Nežinoma liga"}</strong>
                              <span className="illness-date">
                                {formatDate(
                                  illness.dateDiagnosed ||
                                    illness.date ||
                                    illness.Date
                                )}
                              </span>
                            </div>
                            <div className="illness-description">
                              {illness.description || "—"}
                            </div>
                            <div className="record-actions">
                              <button
                                className="btn-icon edit"
                                onClick={() =>
                                  handleEditIllness(pet.id, illness)
                                }
                                title="Redaguoti"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() =>
                                  handleDeleteIllness(pet.id, illness.id)
                                }
                                title="Šalinti"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-message">Nėra įrašų apie ligas</p>
                    )}
                  </div>

                  <div className="pet-section">
                    <div className="section-header">
                      <h5>💉 Skiepai</h5>
                      <button
                        className="btn primary small"
                        onClick={() => handleAddVaccination(pet.id)}
                      >
                        + Pridėti skiepą
                      </button>
                    </div>
                    {pet.vaccinations && pet.vaccinations.length > 0 ? (
                      <div className="vaccinations-list">
                        {pet.vaccinations.map((vaccination) => (
                          <div
                            key={vaccination.id}
                            className="vaccination-item"
                          >
                            <div className="vaccination-header">
                              <strong>{vaccination.name || "Skiepas"}</strong>
                              <span className="vaccination-date">
                                {formatDate(
                                  vaccination.dateAdministered ||
                                    vaccination.date ||
                                    vaccination.Date
                                )}
                              </span>
                            </div>
                            <div className="vaccination-description">
                              {vaccination.description || "—"}
                            </div>
                            {vaccination.manufacturer && (
                              <div className="productused-meta">
                                Gamintojas: {vaccination.manufacturer}
                              </div>
                            )}
                            <div className="record-actions">
                              <button
                                className="btn-icon edit"
                                onClick={() =>
                                  handleEditVaccination(pet.id, vaccination)
                                }
                                title="Redaguoti"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() =>
                                  handleDeleteVaccination(
                                    pet.id,
                                    vaccination.id
                                  )
                                }
                                title="Šalinti"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-message">Nėra įrašytų skiepų</p>
                    )}
                  </div>

                  <div className="pet-section">
                    <div className="section-header">
                      <h5>🧴 Naudojami produktai</h5>
                      <button
                        className="btn primary small"
                        onClick={() => handleAddProductUsed(pet.id)}
                      >
                        + Pridėti produktą
                      </button>
                    </div>
                    {pet.productsUsed && pet.productsUsed.length > 0 ? (
                      <div className="products-used-list">
                        {pet.productsUsed.map((pu) => (
                          <div key={pu.id} className="productused-item">
                            <div className="productused-header">
                              <strong>
                                {pu.productName ||
                                  (pu.productId
                                    ? productsList.find(
                                        (p) => p.id === pu.productId
                                      )?.name
                                    : "Produktas nenurodytas")}
                              </strong>
                              <span className="productused-dosage">
                                Dozė: {pu.dosage ?? "—"} (g.)
                              </span>
                            </div>
                            <div className="productused-meta">
                              Kartų per dieną: {pu.timesPerDay ?? 1}
                            </div>
                            <div className="record-actions">
                              <button
                                className="btn-icon edit"
                                onClick={() =>
                                  handleEditProductUsed(pet.id, pu)
                                }
                                title="Redaguoti"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() =>
                                  handleDeleteProductUsed(pet.id, pu.id)
                                }
                                title="Šalinti"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-message">Nėra įrašytų produktų</p>
                    )}
                  </div>
                </div>
              )}
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
                    value={newPet.name}
                    onChange={(e) =>
                      handlePetInputChange("name", e.target.value)
                    }
                    placeholder="Pvz.: Reksas"
                  />
                </div>

                <div className="form-group">
                  <label>Rūšis (lietuviškai)*</label>
                  <input
                    type="text"
                    required
                    value={newPet.species}
                    onChange={(e) =>
                      handlePetInputChange("species", e.target.value)
                    }
                    placeholder="Pvz.: Šuo, Katė"
                  />
                </div>

                <div className="form-group">
                  <label>Rūšis (lotyniškai)*</label>
                  <input
                    type="text"
                    required
                    value={newPet.speciesLatin}
                    onChange={(e) =>
                      handlePetInputChange("speciesLatin", e.target.value)
                    }
                    placeholder="Pvz.: Canis lupus familiaris"
                  />
                </div>

                <div className="form-group">
                  <label>Veislė*</label>
                  <input
                    type="text"
                    required
                    value={newPet.breed}
                    onChange={(e) =>
                      handlePetInputChange("breed", e.target.value)
                    }
                    placeholder="Pvz.: Labradoro retriveris"
                  />
                </div>

                <div className="form-group">
                  <label>Klasė*</label>
                  <select
                    required
                    value={newPet.class}
                    onChange={(e) =>
                      handlePetInputChange("class", parseInt(e.target.value))
                    }
                  >
                    <option value="">Pasirinkite klasę</option>
                    <option value="0">Žinduoliai (Mammal)</option>
                    <option value="1">Paukščiai (Bird)</option>
                    <option value="2">Ropliai (Reptile)</option>
                    <option value="3">Varliagyviai (Amphibian)</option>
                    <option value="4">Žuvys (Fish)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Gimimo data*</label>
                  <input
                    type="date"
                    required
                    value={newPet.dateOfBirth}
                    onChange={(e) =>
                      handlePetInputChange("dateOfBirth", e.target.value)
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Svoris (kg)*</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPet.weight}
                    onChange={(e) =>
                      handlePetInputChange("weight", e.target.value)
                    }
                    placeholder="Pvz.: 25.5"
                  />
                </div>

                <div className="form-group">
                  <label>Nuotrauka</label>
                  <div
                    className="image-upload-container"
                    onClick={() =>
                      document.getElementById("pet-image-input").click()
                    }
                  >
                    {petImagePreview || newPet.photoUrl ? (
                      <div className="image-preview-wrapper">
                        <img
                          src={
                            petImagePreview ||
                            `http://localhost:5068${newPet.photoUrl}`
                          }
                          alt="Pet preview"
                          className="image-preview"
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePetImage();
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder">
                        <span>🐾</span>
                        <p>📁 Spauskite, kad įkeltumėte nuotrauką</p>
                      </div>
                    )}
                    <input
                      id="pet-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePetImageChange}
                      className="image-upload-input"
                      style={{ display: "none" }}
                    />
                  </div>
                  {uploadingPetImage && (
                    <p className="uploading-text">Įkeliama...</p>
                  )}
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

      {/* Sirgimo pridėjimo forma */}
      {showIllnessForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowIllnessForm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingIllness ? "Redaguoti sirgimą" : "Pridėti sirgimą"}
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowIllnessForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveIllness}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Sirgimo pavadinimas*</label>
                  <input
                    type="text"
                    required
                    value={newIllness.name}
                    onChange={(e) =>
                      setNewIllness({ ...newIllness, name: e.target.value })
                    }
                    placeholder="Pvz.: Ausų infekcija"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Aprašymas*</label>
                  <textarea
                    required
                    value={newIllness.description}
                    onChange={(e) =>
                      setNewIllness({
                        ...newIllness,
                        description: e.target.value,
                      })
                    }
                    rows="4"
                    placeholder="Sirgimo aprašymas ir simptomai"
                  />
                </div>

                <div className="form-group">
                  <label>Diagnozės data*</label>
                  <input
                    type="date"
                    required
                    value={newIllness.dateDiagnosed}
                    onChange={(e) =>
                      setNewIllness({
                        ...newIllness,
                        dateDiagnosed: e.target.value,
                      })
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Susijusi liga (nebūtina)</label>
                  <select
                    value={newIllness.diseaseId || ""}
                    onChange={(e) =>
                      setNewIllness({
                        ...newIllness,
                        diseaseId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(Nėra)</option>
                    {diseasesList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowIllnessForm(false)}
                >
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  {editingIllness ? "Išsaugoti" : "Pridėti sirgimą"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Produkto naudojimo (ProductsUsed) pridėjimo forma */}
      {showProductUsedForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowProductUsedForm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingProductUsed
                  ? "Redaguoti naudojamą produktą"
                  : "Pridėti naudojamą produktą"}
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowProductUsedForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProductUsed}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Produkto pasirinkimas (nebūtina)</label>
                  <select
                    value={newProductUsed.productId || ""}
                    onChange={(e) =>
                      setNewProductUsed({
                        ...newProductUsed,
                        productId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(Nėra)</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Dozė</label>
                  <input
                    type="text"
                    value={newProductUsed.dosage}
                    onChange={(e) =>
                      setNewProductUsed({
                        ...newProductUsed,
                        dosage: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Kartų per dieną</label>
                  <input
                    type="number"
                    min={1}
                    value={newProductUsed.timesPerDay}
                    onChange={(e) =>
                      setNewProductUsed({
                        ...newProductUsed,
                        timesPerDay: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowProductUsedForm(false)}
                >
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  {editingProductUsed ? "Išsaugoti" : "Pridėti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skiepo pridėjimo forma */}
      {showVaccinationForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowVaccinationForm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingVaccination ? "Redaguoti skiepą" : "Pridėti skiepą"}
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowVaccinationForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveVaccination}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Skiepo pavadinimas*</label>
                  <input
                    type="text"
                    required
                    value={newVaccination.name}
                    onChange={(e) =>
                      setNewVaccination({
                        ...newVaccination,
                        name: e.target.value,
                      })
                    }
                    placeholder="Pvz.: Pasiutligės vakcina"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Aprašymas</label>
                  <textarea
                    value={newVaccination.description}
                    onChange={(e) =>
                      setNewVaccination({
                        ...newVaccination,
                        description: e.target.value,
                      })
                    }
                    rows="4"
                    placeholder="Skiepo aprašymas ir pastabos"
                  />
                </div>

                <div className="form-group">
                  <label>Skiepo data*</label>
                  <input
                    type="date"
                    required
                    value={newVaccination.dateAdministered}
                    onChange={(e) =>
                      setNewVaccination({
                        ...newVaccination,
                        dateAdministered: e.target.value,
                      })
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowVaccinationForm(false)}
                >
                  Atšaukti
                </button>
                <button type="submit" className="btn primary">
                  {editingVaccination ? "Išsaugoti" : "Pridėti skiepą"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
            onClick={() => setShowPasswordModal(true)}
            disabled={loading}
          >
            Keisti slaptažodį
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
        {!isAdmin && (
          <button
            className={`tab ${activeTab === "pets" ? "active" : ""}`}
            onClick={() => setActiveTab("pets")}
            disabled={loading}
          >
            Gyvūnai
          </button>
        )}
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
        {activeTab === "pets" && !isAdmin && renderPetsTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPasswordModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Keisti slaptažodį</h3>
              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Dabartinis slaptažodis</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Naujas slaptažodis</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Pakartokite naują slaptažodį</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={loading}
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={loading}
                >
                  {loading ? "Keičiama..." : "Pakeisti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
