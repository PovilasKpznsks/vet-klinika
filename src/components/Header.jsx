import './Header.css'

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="clinic-title">Veterinarijos klinika "Sveiki gyvūnai"</h1>
        
        {user && (
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">{user.firstName} {user.lastName}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <div className="user-avatar">
              <span>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</span>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Atsijungti">
              Atsijungti
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header