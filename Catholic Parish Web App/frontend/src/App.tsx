import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Families from './pages/Families';
import FamilyDetail from './pages/FamilyDetail';
import People from './pages/People';
import PersonDetail from './pages/PersonDetail';
import Sacraments from './pages/Sacraments';
import Certificates from './pages/Certificates';
import Admin from './pages/Admin';
import Verify from './pages/Verify';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify/:token" element={<Verify />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="families" element={<Families />} />
            <Route path="families/:id" element={<FamilyDetail />} />
            <Route path="people" element={<People />} />
            <Route path="people/:id" element={<PersonDetail />} />
            <Route path="sacraments" element={<Sacraments />} />
            <Route path="certificates" element={<Certificates />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute roles={['parish_admin', 'auditor']}>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
