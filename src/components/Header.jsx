import "./Header.css";

const Header = ({ user, onLogout }) => {
  const first = user?.firstName || user?.name || user?.givenName || "";
  const last = user?.lastName || user?.surname || user?.familyName || "";
  const email = user?.email || user?.userName || "";
  const firstInitial = first?.charAt ? first.charAt(0) : "";
  const lastInitial = last?.charAt ? last.charAt(0) : "";
  const photoUrl = user?.photoUrl;

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="clinic-title">Veterinarijos klinika "Sveiki gyvūnai"</h1>

        {user ? (
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">
                {first || last ? `${first} ${last}`.trim() : "Vartotojas"}
              </span>
              {email && <span className="user-email">{email}</span>}
            </div>
            <div className="user-avatar">
              {photoUrl ? (
                <img
                  src={`http://localhost:5068${photoUrl}`}
                  alt="Profile"
                  className="user-avatar-img"
                />
              ) : (
                <span>
                  {firstInitial}
                  {lastInitial}
                </span>
              )}
            </div>
            <button
              className="logout-btn"
              onClick={onLogout}
              title="Atsijungti"
            >
              Atsijungti
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
