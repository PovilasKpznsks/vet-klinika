import { useState } from 'react'
import Header from './components/Header'
import Navbar from './components/Navbar'
import NotificationContainer from './components/NotificationContainer'
import Home from './pages/Home'
import Account from './pages/Account'
import Diseases from './pages/Diseases'
import Products from './pages/Products'
import Visits from './pages/Visits'
import Auth from './pages/Auth'
import './styles/App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />
      case 'account':
        return <Account />
      case 'diseases':
        return <Diseases />
      case 'products':
        return <Products />
      case 'visits':
        return <Visits />
      case 'auth':
        return <Auth />
      default:
        return <Home />
    }
  }

  return (
    <div className="app">
      <Header />
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
      <NotificationContainer />
    </div>
  )
}

export default App