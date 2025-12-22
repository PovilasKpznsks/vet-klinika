import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";
import { notificationService } from "../services/notificationService";
import "../styles/Auth.css";

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login: contextLogin, register: contextRegister } = useAuth();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  // Forgot password state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate Lithuanian personal code
  const validatePersonalCode = (code) => {
    // Basic Lithuanian personal code validation (11 digits)
    const codeRegex = /^[0-9]{11}$/;
    return codeRegex.test(code);
  };

  // Validate phone number
  const validatePhone = (phone) => {
    const phoneRegex = /^(\+370|8)[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!loginData.email) {
      newErrors.email = "El. paštas yra privalomas";
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = "Neteisingas el. pašto formatas";
    }

    if (!loginData.password) {
      newErrors.password = "Slaptažodis yra privalomas";
    } else if (loginData.password.length < 6) {
      newErrors.password = "Slaptažodis turi būti bent 6 simbolių";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await contextLogin(loginData);

      if (result.success) {
        notificationService.addSuccess("Sėkmingai prisijungėte!");
        // Reset form
        setLoginData({ email: "", password: "" });
        // Call success callback if provided
        if (onAuthSuccess) {
          onAuthSuccess(result.user);
        }
      }

      // Fallback: if login succeeded but parent didn't provide a handler,
      // reload so App reads new auth state and navigates accordingly.
      if (result.success && !onAuthSuccess) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Login error:", error);
      notificationService.addError(error.message || "Prisijungimo klaida");
    } finally {
      setLoading(false);
    }
  };

  // Handle registration form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!registerData.firstName) {
      newErrors.firstName = "Vardas yra privalomas";
    }

    if (!registerData.lastName) {
      newErrors.lastName = "Pavardė yra privaloma";
    }

    if (!registerData.email) {
      newErrors.email = "El. paštas yra privalomas";
    } else if (!validateEmail(registerData.email)) {
      newErrors.email = "Neteisingas el. pašto formatas";
    }

    if (!registerData.phone) {
      newErrors.phone = "Telefono numeris yra privalomas";
    } else if (!validatePhone(registerData.phone)) {
      newErrors.phone = "Neteisingas telefono numerio formatas";
    }

    if (!registerData.password) {
      newErrors.password = "Slaptažodis yra privalomas";
    } else if (registerData.password.length < 8) {
      newErrors.password = "Slaptažodis turi būti bent 8 simbolių";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerData.password)) {
      newErrors.password =
        "Slaptažodis turi turėti bent vieną mažą raidę, didžią raidę ir skaičių";
    }

    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Slaptažodžiai nesutampa";
    }

    if (!registerData.agreeToTerms) {
      newErrors.agreeToTerms = "Turite sutikti su naudojimo sąlygomis";
    }

    if (!registerData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = "Turite sutikti su privatumo politika";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { confirmPassword, agreeToTerms, agreeToPrivacy, ...rest } =
        registerData;
      // Map frontend fields to backend DTO expected names
      const userData = {
        Name: rest.firstName,
        Surname: rest.lastName,
        Email: rest.email,
        Password: rest.password,
        PhoneNumber: rest.phone,
        PhotoUrl: rest.photoUrl || "",
      };
      const result = await contextRegister(userData);

      if (result.success) {
        notificationService.addSuccess(
          "Registracija sėkminga! Dabar galite prisijungti."
        );
        // Reset form
        setRegisterData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false,
          agreeToPrivacy: false,
        });
        // Switch to login view
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Registration error:", error);
      notificationService.addError(error.message || "Registracijos klaida");
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      setErrors({ forgotEmail: "El. paštas yra privalomas" });
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      setErrors({ forgotEmail: "Neteisingas el. pašto formatas" });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authService.requestPasswordReset(forgotPasswordEmail);
      notificationService.addSuccess(
        "Slaptažodžio atkūrimo instrukcijos išsiųstos į jūsų el. paštą"
      );
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);
      notificationService.addError(
        error.message || "Klaida siunčiant slaptažodžio atkūrimo instrukcijas"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleLoginChange = (field, value) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleRegisterChange = (field, value) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (showForgotPassword) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Slaptažodžio atkūrimas</h2>
              <p>
                Įveskite savo el. pašto adresą ir mes atsiųsime slaptažodžio
                atkūrimo instrukcijas
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="forgotEmail">El. pašto adresas</label>
                <input
                  id="forgotEmail"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className={errors.forgotEmail ? "error" : ""}
                  placeholder="Įveskite savo el. pašto adresą"
                  disabled={loading}
                />
                {errors.forgotEmail && (
                  <span className="error-message">{errors.forgotEmail}</span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn primary"
                  disabled={loading}
                >
                  {loading ? "Siunčiama..." : "Siųsti instrukcijas"}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={loading}
                >
                  Atgal į prisijungimą
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? "Prisijungimas" : "Registracija"}</h2>
            <p>
              {isLogin
                ? "Prisijunkite prie savo paskyros"
                : "Sukurkite naują paskyrą veterinarijos klinikoje"}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? "active" : ""}`}
              onClick={() => {
                setIsLogin(true);
                setErrors({});
              }}
              disabled={loading}
            >
              Prisijungimas
            </button>
            <button
              className={`auth-tab ${!isLogin ? "active" : ""}`}
              onClick={() => {
                setIsLogin(false);
                setErrors({});
              }}
              disabled={loading}
            >
              Registracija
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="loginEmail">El. paštas</label>
                <input
                  id="loginEmail"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => handleLoginChange("email", e.target.value)}
                  className={errors.email ? "error" : ""}
                  placeholder="vardas@pavyzdys.lt"
                  disabled={loading}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="loginPassword">Slaptažodis</label>
                <input
                  id="loginPassword"
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    handleLoginChange("password", e.target.value)
                  }
                  className={errors.password ? "error" : ""}
                  placeholder="Įveskite slaptažodį"
                  disabled={loading}
                />
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn primary full-width"
                  disabled={loading}
                >
                  {loading ? "Prisijungiama..." : "Prisijungti"}
                </button>
              </div>

              <div className="auth-links">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={loading}
                >
                  Pamiršote slaptažodį?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Vardas*</label>
                  <input
                    id="firstName"
                    type="text"
                    value={registerData.firstName}
                    onChange={(e) =>
                      handleRegisterChange("firstName", e.target.value)
                    }
                    className={errors.firstName ? "error" : ""}
                    placeholder="Jonas"
                    disabled={loading}
                  />
                  {errors.firstName && (
                    <span className="error-message">{errors.firstName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Pavardė*</label>
                  <input
                    id="lastName"
                    type="text"
                    value={registerData.lastName}
                    onChange={(e) =>
                      handleRegisterChange("lastName", e.target.value)
                    }
                    className={errors.lastName ? "error" : ""}
                    placeholder="Jonaitis"
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <span className="error-message">{errors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="registerEmail">El. paštas*</label>
                <input
                  id="registerEmail"
                  type="email"
                  value={registerData.email}
                  onChange={(e) =>
                    handleRegisterChange("email", e.target.value)
                  }
                  className={errors.email ? "error" : ""}
                  placeholder="vardas@pavyzdys.lt"
                  disabled={loading}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Telefono numeris*</label>
                <input
                  id="phone"
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) =>
                    handleRegisterChange("phone", e.target.value)
                  }
                  className={errors.phone ? "error" : ""}
                  placeholder="+370 600 00000"
                  disabled={loading}
                />
                {errors.phone && (
                  <span className="error-message">{errors.phone}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="registerPassword">Slaptažodis*</label>
                  <input
                    id="registerPassword"
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      handleRegisterChange("password", e.target.value)
                    }
                    className={errors.password ? "error" : ""}
                    placeholder="Bent 8 simboliai"
                    disabled={loading}
                  />
                  {errors.password && (
                    <span className="error-message">{errors.password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Pakartokite slaptažodį*
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      handleRegisterChange("confirmPassword", e.target.value)
                    }
                    className={errors.confirmPassword ? "error" : ""}
                    placeholder="Pakartokite slaptažodį"
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <span className="error-message">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    id="agreeToTerms"
                    type="checkbox"
                    checked={registerData.agreeToTerms}
                    onChange={(e) =>
                      handleRegisterChange("agreeToTerms", e.target.checked)
                    }
                    disabled={loading}
                  />
                  <label htmlFor="agreeToTerms">
                    Sutinku su{" "}
                    <a href="#" target="_blank">
                      naudojimo sąlygomis
                    </a>
                    *
                  </label>
                  {errors.agreeToTerms && (
                    <span className="error-message">{errors.agreeToTerms}</span>
                  )}
                </div>

                <div className="checkbox-item">
                  <input
                    id="agreeToPrivacy"
                    type="checkbox"
                    checked={registerData.agreeToPrivacy}
                    onChange={(e) =>
                      handleRegisterChange("agreeToPrivacy", e.target.checked)
                    }
                    disabled={loading}
                  />
                  <label htmlFor="agreeToPrivacy">
                    Sutinku su{" "}
                    <a href="#" target="_blank">
                      privatumo politika
                    </a>
                    *
                  </label>
                  {errors.agreeToPrivacy && (
                    <span className="error-message">
                      {errors.agreeToPrivacy}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn primary full-width"
                  disabled={loading}
                >
                  {loading ? "Registruojama..." : "Registruotis"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
