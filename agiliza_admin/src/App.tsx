import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PlansPage } from './pages/PlansPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { UsersPage } from './pages/UsersPage';
import { FinancialPage } from './pages/FinancialPage';
import { ServicesStatsPage } from './pages/ServicesStatsPage';
import { StaffPage } from './pages/StaffPage';
import { RegisterStaffPage } from './pages/RegisterStaffPage';

function PrivateLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/financeiro" element={<FinancialPage />} />
          <Route path="/servicos" element={<ServicesStatsPage />} />
          <Route path="/equipe" element={<StaffPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro-staff" element={<RegisterStaffPage />} />
          <Route path="/*" element={<PrivateLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
