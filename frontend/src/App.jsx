import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/Common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ItinerariesPage from './pages/ItinerariesPage';
import ItineraryDetailPage from './pages/ItineraryDetailPage';
import SharedItineraryPage from './pages/SharedItineraryPage';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route path="/shared/:shareToken" element={<SharedItineraryPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <DashboardPage />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/itineraries"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <ItinerariesPage />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/itineraries/:id"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <ItineraryDetailPage />
            </>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '10px', background: '#1f2937', color: '#fff' },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
