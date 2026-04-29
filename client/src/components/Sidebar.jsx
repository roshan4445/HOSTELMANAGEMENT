import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Home, Users, DollarSign, LogOut, Megaphone, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useContext(AuthContext);

  const links = [
    { to: '/', icon: <LayoutDashboard size={20} />, text: 'Dashboard' },
    { to: '/rooms', icon: <Home size={20} />, text: 'Rooms' },
    { to: '/tenants', icon: <Users size={20} />, text: 'Tenants' },
    { to: '/payments', icon: <DollarSign size={20} />, text: 'Payments' },
    { to: '/complaints', icon: <AlertCircle size={20} />, text: 'Complaints' },
    { to: '/announcements', icon: <Megaphone size={20} />, text: 'Announcements' },
  ];

  return (
    <div 
      className={`w-64 bg-white/80 backdrop-blur-md shadow-2xl h-screen fixed top-0 left-0 flex flex-col justify-between border-r border-gray-100/50 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">{user?.pgName || 'StayFlow'}</h1>
        </div>
        <nav className="mt-6 flex flex-col gap-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors border-l-4 border-transparent font-medium'
                }`
              }
              onClick={() => setIsOpen && setIsOpen(false)}
            >
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 5 }} 
                className={`mr-3 transition-colors ${link.isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`}
              >
                {link.icon}
              </motion.span>
              {link.text}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-6 border-t border-gray-100">
        <motion.button
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="flex items-center text-gray-500 hover:text-rose-500 font-semibold transition-colors w-full"
        >
          <LogOut size={20} className="mr-3" />
          Logout
        </motion.button>
      </div>
    </div>
  );
};

export default Sidebar;
