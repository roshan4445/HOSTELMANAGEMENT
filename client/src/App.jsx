import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Complaints from './pages/Complaints';
import Announcements from './pages/Announcements';
import PublicView from './pages/PublicView';

import TenantLayout from './components/tenant/TenantLayout';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantRent from './pages/tenant/TenantRent';
import TenantComplaints from './pages/tenant/TenantComplaints';
import TenantAlerts from './pages/tenant/TenantAlerts';

import { Menu } from 'lucide-react';

const ProtectedRoute = ({ children, requireRole }) => {
  const { user, loading, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireRole && user.role !== requireRole) return <Navigate to="/" />;
  
  if (user.role === 'tenant') {
    return <TenantLayout user={user} logout={logout}>{children}</TenantLayout>;
  }
  
  return (
    <div className="flex bg-gradient-to-br from-gray-50 to-indigo-50 min-h-screen w-full overflow-x-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 lg:ml-64 w-full min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
          <h1 className="text-xl font-bold text-indigo-600">StayFlow</h1>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
        </div>
        <div className="p-4 md:p-8 overflow-y-auto w-full flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'tenant' ? <TenantDashboard /> : <Dashboard />}
        </ProtectedRoute>
      } />
      
      {/* Admin Only Routes */}
      <Route path="/rooms" element={<ProtectedRoute requireRole="owner"><Rooms /></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute requireRole="owner"><Tenants /></ProtectedRoute>} />
      
      {/* Shared/Dynamic Routes based on role */}
      <Route path="/payments" element={<ProtectedRoute requireRole="owner"><Payments /></ProtectedRoute>} />
      
      <Route path="/complaints" element={
        <ProtectedRoute>
          {user?.role === 'tenant' ? <TenantComplaints /> : <Complaints />}
        </ProtectedRoute>
      } />
      
      <Route path="/announcements" element={<ProtectedRoute requireRole="owner"><Announcements /></ProtectedRoute>} />
      
      {/* Tenant Only Routes */}
      <Route path="/rent" element={<ProtectedRoute requireRole="tenant"><TenantRent /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute requireRole="tenant"><TenantAlerts /></ProtectedRoute>} />

      <Route path="/pg/:pgName" element={<PublicView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
