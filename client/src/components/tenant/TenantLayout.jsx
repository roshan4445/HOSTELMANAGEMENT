import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CreditCard, MessageSquare, LogOut, Bell, Languages, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../context/ThemeContext';

const TenantLayout = ({ children, user, logout }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = React.useContext(ThemeContext);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { name: t('sidebar.dashboard'), path: '/', icon: <Home size={24} /> },
    { name: t('sidebar.rent'), path: '/rent', icon: <CreditCard size={24} /> },
    { name: t('sidebar.complaints'), path: '/complaints', icon: <MessageSquare size={24} /> },
    { name: t('sidebar.alerts'), path: '/alerts', icon: <Bell size={24} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 md:pl-64 transition-colors duration-300">
      {/* Top Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{user.pgName}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Welcome, {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={toggleLanguage} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            <Languages size={20} />
          </button>
          <button onClick={handleLogout} className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-500 dark:text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 md:pb-8 w-full max-w-4xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 px-6 py-2 flex justify-between items-center z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-bold mt-1">{item.name}</span>
          </NavLink>
        ))}
      </div>
      
      {/* Side Navigation (Desktop) */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-4 gap-2 z-40 shadow-sm dark:shadow-slate-900/50 transition-colors duration-300">
        <div className="mb-8 mt-2 px-2">
           <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">StayFlow <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Tenant</span></h1>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold ${
                isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/50' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-gray-200'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
        
        <div className="mt-auto px-2 flex flex-col gap-2">
           <button 
             onClick={toggleTheme}
             className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
           >
             {theme === 'dark' ? <><Sun size={18} /> Light Mode</> : <><Moon size={18} /> Dark Mode</>}
           </button>
           <button 
             onClick={toggleLanguage}
             className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-semibold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
           >
             <Languages size={18} />
             {i18n.language === 'en' ? 'తెలుగు (Telugu)' : 'English'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default TenantLayout;
