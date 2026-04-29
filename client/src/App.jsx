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

import { Menu } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
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
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
