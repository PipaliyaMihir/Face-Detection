import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { verifyAuth } from './api/api';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('attendease_token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      try {
        await verifyAuth();
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('attendease_token');
        localStorage.removeItem('attendease_user');
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <main className="pt-20 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<UserPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
