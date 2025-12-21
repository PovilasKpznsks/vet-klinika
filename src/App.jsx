import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import NotificationContainer from "./components/NotificationContainer";
import Home from "./pages/Home";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Diseases from "./pages/Diseases";
import Products from "./pages/Products";
import Visits from "./pages/Visits";
import Auth from "./pages/Auth";
import "./styles/App.css";
import signalRClient from "./services/signalRClient";

// Main app content component that uses auth context
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const { isAuthenticated, loading, user, login, register, logout } = useAuth();

  // Check URL for product parameter on mount - redirect to products page if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("product")) {
      setCurrentPage("products");
    }
  }, []);

  // Initialize SignalR after authentication
  useEffect(() => {
    let stopped = false;
    const token = localStorage.getItem("authToken");
    if (isAuthenticated) {
      signalRClient.start(token);
    } else {
      signalRClient.stop();
    }
    return () => {
      if (!stopped) {
        signalRClient.stop();
        stopped = true;
      }
    };
  }, [isAuthenticated]);

  // Handle successful authentication
  const handleAuthSuccess = async (userData) => {
    setCurrentPage("account"); // Redirect to account page after successful auth
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setCurrentPage("home"); // Redirect to home after logout
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Kraunama...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home />;
      case "admin":
        return isAuthenticated ? (
          <Admin />
        ) : (
          <Auth onAuthSuccess={handleAuthSuccess} />
        );
      case "account":
        return isAuthenticated ? (
          <Account />
        ) : (
          <Auth onAuthSuccess={handleAuthSuccess} />
        );
      case "diseases":
        return <Diseases />;
      case "products":
        return <Products />;
      case "visits":
        return isAuthenticated ? (
          <Visits />
        ) : (
          <Auth onAuthSuccess={handleAuthSuccess} />
        );
      case "auth":
        return isAuthenticated ? (
          <Account />
        ) : (
          <Auth onAuthSuccess={handleAuthSuccess} />
        );
      default:
        return <Home />;
    }
  };

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isAuthenticated={isAuthenticated}
      />
      <main className="main-content">{renderPage()}</main>
      <NotificationContainer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
