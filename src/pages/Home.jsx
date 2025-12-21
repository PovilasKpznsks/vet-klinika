import "../styles/Home.css";

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Veterinarijos klinika "Sveiki gyvūnai"</h1>
          <p className="hero-subtitle">
            Profesionali sveikatos priežiūra jūsų augintiniams
          </p>
          <p className="hero-description">
            Teikiame aukščiausios kokybės veterinarines paslaugas šunims, katėms
            ir kitiems augintiniams. Mūsų patyrę veterinarai pasirūpins jūsų
            keturkojo draugo sveikata.
          </p>
          <div className="hero-buttons">
            <a href="#services" className="btn primary">
              Mūsų paslaugos
            </a>
            <a href="#contact" className="btn secondary">
              Susisiekite
            </a>
          </div>
        </div>
        <div className="hero-image">
          <span className="hero-icon">🐾</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Kodėl pasirinkti mus?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">👨‍⚕️</span>
            <h3>Patyrę veterinarai</h3>
            <p>
              Mūsų komandą sudaro aukščiausios kvalifikacijos specialistai su
              daugiau nei 10 metų patirtimi
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🏥</span>
            <h3>Moderni įranga</h3>
            <p>Naudojame naujausias technologijas diagnostikai ir gydymui</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⏰</span>
            <h3>Patogus vizitų planavimas</h3>
            <p>Registruokitės online ir valdykite savo vizitus 24/7</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💚</span>
            <h3>Individuali priežiūra</h3>
            <p>Kiekvienas augintinis sulaukia asmeninio dėmesio ir rūpesčio</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <h2>Mūsų paslaugos</h2>
        <div className="services-grid">
          <div className="service-item">
            <span className="service-icon">🩺</span>
            <h3>Profilaktiniai patikrinimai</h3>
            <p>Reguliarūs sveikatos patikrinimai ir vakcinacijos</p>
          </div>
          <div className="service-item">
            <span className="service-icon">💉</span>
            <h3>Chirurgija</h3>
            <p>Saugios ir profesionalios chirurginės operacijos</p>
          </div>
          <div className="service-item">
            <span className="service-icon">🔬</span>
            <h3>Laboratoriniai tyrimai</h3>
            <p>Tikslūs diagnostiniai testai ir analizės</p>
          </div>
          <div className="service-item">
            <span className="service-icon">🦷</span>
            <h3>Dantų priežiūra</h3>
            <p>Profesionalus dantų valymas ir gydymas</p>
          </div>
          <div className="service-item">
            <span className="service-icon">📋</span>
            <h3>Ligų valdymas</h3>
            <p>Lėtinių ligų diagnostika ir gydymas</p>
          </div>
          <div className="service-item">
            <span className="service-icon">🛒</span>
            <h3>Produktai</h3>
            <p>Kokybiški pašarai, papildai ir priežiūros priemonės</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">2500+</span>
            <span className="stat-label">Laimingų augintinių</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15+</span>
            <span className="stat-label">Metų patirties</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">10+</span>
            <span className="stat-label">Specialistų</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Skubi pagalba</span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <h2>Susisiekite su mumis</h2>
        <div className="contact-info">
          <div className="contact-item">
            <span className="contact-icon">📍</span>
            <div>
              <h3>Adresas</h3>
              <p>Veterinarijos g. 123, Vilnius</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">📞</span>
            <div>
              <h3>Telefonas</h3>
              <p>+370 600 12345</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">✉️</span>
            <div>
              <h3>El. paštas</h3>
              <p>info@vetklinika.lt</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">🕐</span>
            <div>
              <h3>Darbo laikas</h3>
              <p>
                Pr-Pn: 8:00-20:00
                <br />
                Š-S: 9:00-18:00
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
