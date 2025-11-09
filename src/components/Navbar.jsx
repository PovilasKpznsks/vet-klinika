import { useState } from 'react'
import './Navbar.css'

const Navbar = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { id: 'home', label: 'Pagrindinis' },
    { id: 'account', label: 'Paskyra' },
    { id: 'diseases', label: 'Ligos' },
    { id: 'products', label: 'Produktai' },
    { id: 'visits', label: 'Vizitai' },
    { id: 'auth', label: 'Prisijungti/Registruotis' }
  ]

  return (
    <nav className="navbar">
      <ul className="nav-list">
        {menuItems.map(item => (
          <li key={item.id} className="nav-item">
            <button 
              className={`nav-button ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar