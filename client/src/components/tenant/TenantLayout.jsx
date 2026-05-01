import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CreditCard, MessageSquare, LogOut, Bell } from 'lucide-react';

const TenantLayout = ({ children, user, logout }) => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={24} /> },
    { name: 'Rent', path: '/rent', icon: <CreditCard size={24} /> },
    { name: 'Complaints', path: '/complaints', icon: <MessageSquare size={24} /> },
    { name: 'Alerts', path: '/alerts', icon: <Bell size={24} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 md:pl-64">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-bold text-indigo-600">{user.pgName}</h1>
          <p className="text-xs text-gray-500 font-medium">Welcome, {user.name}</p>
        </div>
        <button onClick={handleLogout} className="p-2 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 md:pb-8 w-full max-w-4xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-6 py-2 flex justify-between items-center z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-bold mt-1">{item.name}</span>
          </NavLink>
        ))}
      </div>
      
      {/* Side Navigation (Desktop) */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-4 gap-2 z-40 shadow-sm">
        <div className="mb-8 mt-2 px-2">
           <h1 className="text-2xl font-black text-indigo-600 tracking-tight">StayFlow <span className="text-xs text-gray-400 font-medium">Tenant</span></h1>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold ${
                isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default TenantLayout;
