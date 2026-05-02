import React, { useState, useEffect, useContext } from 'react';
import DashboardService from '../services/dashboardService';
import { AuthContext } from '../context/AuthContext';
import { DollarSign, AlertTriangle, Clock, FileText, MessageCircle, Check, UserPlus, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../lib/api';
import socket, { connectSocket } from '../socket';


const HeroPendingCard = ({ pending, unpaidCount }) => {
  if (pending === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-3xl shadow-md border border-emerald-200 dark:border-emerald-800/30 flex flex-col justify-center transform hover:scale-[1.01] transition-transform">
        <div className="flex items-center gap-2 mb-3">
          <Check className="text-emerald-500" size={28} strokeWidth={3} />
          <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">All Caught Up!</h2>
        </div>
        <h3 className="text-6xl sm:text-7xl font-black text-emerald-600 dark:text-emerald-400 my-4 tracking-tight">₹0</h3>
        <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 inline-block px-5 py-2.5 rounded-xl self-start mt-2">
          🎉 100% of rents collected
        </p>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-900/20 p-8 rounded-3xl shadow-md border border-rose-200 dark:border-rose-800/30 flex flex-col justify-center transform hover:scale-[1.01] transition-transform">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="text-rose-500" size={28} />
        <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400">Attention Required</h2>
      </div>
      <h3 className="text-6xl sm:text-7xl font-black text-rose-600 dark:text-rose-400 my-4 tracking-tight">₹{pending}</h3>
      <p className="text-lg font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40 inline-block px-5 py-2.5 rounded-xl self-start mt-2">
        ⚠️ ₹{pending} Pending • {unpaidCount} tenants unpaid
      </p>
    </div>
  );
};

const QuickActions = ({ onSendAllReminders }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col justify-center h-full">
    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">⚡ Quick Actions</h3>
    <div className="space-y-4">
      <Link to="/tenants" className="w-full flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-2xl font-bold transition-all hover:translate-x-1">
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm"><UserPlus size={20} /></div>
        Add Tenant
      </Link>
      <Link to="/payments" className="w-full flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-2xl font-bold transition-all hover:translate-x-1">
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm"><DollarSign size={20} /></div>
        Record Payment
      </Link>
      <button onClick={onSendAllReminders} className="w-full flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-2xl font-bold transition-all hover:translate-x-1 text-left">
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm"><MessageCircle size={20} /></div>
        Send All Reminders
      </button>
    </div>
  </div>
);

const ControlFeedback = ({ expected, collected }) => {
  const collectionPercentage = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  
  return (
    <div className="bg-indigo-600 rounded-3xl p-6 sm:p-8 shadow-md text-white flex flex-col justify-center">
      <div className="flex justify-between items-end mb-4">
        <h3 className="font-bold text-indigo-100 text-lg">💰 Monthly Collection</h3>
        <span className="text-4xl font-black">{collectionPercentage}%</span>
      </div>
      <div className="w-full bg-indigo-900/50 rounded-full h-5 mb-4 overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }} animate={{ width: `${collectionPercentage}%` }} transition={{ duration: 1, ease: "easeOut" }}
          className={`h-5 rounded-full ${collectionPercentage === 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-400 to-teal-300'}`}
        ></motion.div>
      </div>
      <p className="font-medium text-indigo-100 text-lg">You have collected <strong className="text-white">{collectionPercentage}%</strong> of rent this month (₹{collected} of ₹{expected})</p>
    </div>
  );
};

const MoneyStats = ({ expected, collected }) => (
  <div className="grid grid-cols-2 gap-4 h-full">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col justify-center">
      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Expected Rent</p>
      <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">₹{expected}</h3>
    </div>
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col justify-center">
      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Collected</p>
      <h3 className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">₹{collected}</h3>
    </div>
  </div>
);

const TenantRow = ({ tenant, onMarkPaid, onSendReminder }) => (
  <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-700/50 last:border-0">
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
      <h4 className="font-bold text-gray-900 dark:text-white text-lg w-48 truncate">{tenant.name}</h4>
      <span className="font-black text-gray-900 dark:text-white text-xl w-24">₹{tenant.amount}</span>
      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${tenant.daysLate === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
        {tenant.daysLate === 0 ? '🟡 Due Today' : `🔴 ${tenant.daysLate} Days Late`}
      </span>
    </div>
    
    <div className="flex w-full lg:w-auto gap-2">
      <button onClick={() => onMarkPaid(tenant.id)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold transition-colors">
        <Check size={18} /> Mark Paid
      </button>
      <button onClick={() => onSendReminder(tenant)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-4 py-2.5 rounded-xl font-bold transition-colors">
        <MessageCircle size={18} /> Remind
      </button>
      <a href={`tel:${tenant.phone}`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white text-gray-700 px-4 py-2.5 rounded-xl font-bold transition-colors">
        <Phone size={18} /> Call
      </a>
    </div>
  </div>
);

const UnpaidTenantsList = ({ tenants, pendingAmount, onMarkPaid, onSendReminder, onSendAllReminders }) => (
  <div className="mt-6 mb-8">
    {/* PSYCHOLOGICAL TRIGGER HEADER */}
    {tenants.length > 0 && (
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          🔔 {tenants.length} Pending Collections (Total: ₹{pendingAmount})
        </h2>
        <button onClick={onSendAllReminders} className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 px-4 py-2 rounded-xl font-bold transition-colors shadow-sm self-start sm:self-auto">
          <MessageCircle size={18} /> Send Bulk Reminder
        </button>
      </div>
    )}
    
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
      <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
        {tenants.length > 0 ? tenants.map(tenant => (
          <TenantRow key={tenant.id} tenant={tenant} onMarkPaid={onMarkPaid} onSendReminder={onSendReminder} />
        )) : (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full mb-4">
              <Check className="text-emerald-600 dark:text-emerald-400" size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">All Rents Collected!</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">There are no pending tenants right now. Great job.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const RecentActivity = ({ activities }) => (
  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 mt-8">
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
    <div className="space-y-5">
      {activities && activities.length > 0 ? activities.slice(0, 5).map((activity, idx) => (
        <div key={activity.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`p-2.5 rounded-full ${activity.type === 'Payment' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
              {activity.type === 'Payment' ? <DollarSign size={16} /> : <FileText size={16} />}
            </div>
            {idx !== (activities.length > 5 ? 4 : activities.length - 1) && <div className="w-px h-full bg-gray-100 dark:bg-slate-700/50 mt-2"></div>}
          </div>
          <div className="pb-2">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{activity.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <Clock size={10} /> {format(new Date(activity.date), 'dd MMM, hh:mm a')}
            </div>
          </div>
        </div>
      )) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No recent activity.</p>
      )}
    </div>
  </div>
);

// --- MAIN DASHBOARD ---

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({ 
    monthlyRevenue: 0,
    pendingRevenueAmount: 0, 
    totalExpectedRevenue: 0, 
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Real Unpaid Tenants Data
  const [unpaidTenants, setUnpaidTenants] = useState([]);

  const fetchStats = async () => {
    try {
      const data = await DashboardService.getStats();
      
      setUnpaidTenants(data.unpaidTenants || []);

      setStats(prev => ({
        ...prev,
        totalExpectedRevenue: data.totalExpectedRevenue || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        pendingRevenueAmount: data.pendingRevenueAmount || 0,
        recentActivity: data.recentActivity || []
      }));
      
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Setup Socket.IO for real-time updates
    connectSocket();
    
    if (user && (user._id || user.id)) {
      socket.emit('join-owner', user._id || user.id);
    }

    const handlePaymentUpdated = (payment) => {
      console.log('Real-time payment update received:', payment);
      // Quickly re-fetch all stats to ensure data consistency
      fetchStats();
      toast.success(`Real-time update: Payment of ₹${payment.total} received!`, { icon: '⚡' });
    };

    socket.on('payment-updated', handlePaymentUpdated);

    return () => {
      socket.off('payment-updated', handlePaymentUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkPaid = async (id) => {
    try {
      const tenant = unpaidTenants.find(t => t.id === id);
      
      // Make real API call to backend
      await API.put(`/api/payments/${id}/pay`, { paymentMode: 'Cash' });

      // Optimistic UI update
      setUnpaidTenants(unpaidTenants.filter(t => t.id !== id));
      
      setStats(prev => ({
        ...prev,
        monthlyRevenue: prev.monthlyRevenue + tenant.amount,
        pendingRevenueAmount: prev.pendingRevenueAmount - tenant.amount,
        recentActivity: [
          {
            id: Date.now().toString(),
            type: 'Payment',
            title: 'Payment Received',
            description: `₹${tenant.amount} received from ${tenant.name}`,
            date: new Date().toISOString()
          },
          ...prev.recentActivity
        ]
      }));
      
      toast.success(`₹${tenant.amount} recorded for ${tenant.name}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to mark as paid');
    }
  };

  const handleSendReminder = (tenant) => {
    const message = `Hi ${tenant.name}, your rent ₹${tenant.amount} is due. Please pay today.`;
    toast.success(message, { duration: 5000, icon: '💬' });
    
    // Simulating WhatsApp redirect:
    // window.open(`https://wa.me/91${tenant.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendAllReminders = () => {
    toast.success(`Reminders sent to all ${unpaidTenants.length} pending tenants!`);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-64 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-rose-50 dark:bg-slate-800 p-6 rounded-3xl h-64"></div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-10 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-transparent mb-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.welcome')}, <span className="text-indigo-600 dark:text-indigo-400">{user?.name}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Money Control Panel.</p>
        </div>
      </div>
      
      {/* 1. TOP HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HeroPendingCard 
            pending={stats.pendingRevenueAmount} 
            unpaidCount={unpaidTenants.length} 
          />
        </div>
        <div>
          <QuickActions onSendAllReminders={handleSendAllReminders} />
        </div>
      </div>

      {/* 2. CONTROL FEEDBACK & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <ControlFeedback 
          expected={stats.totalExpectedRevenue} 
          collected={stats.monthlyRevenue} 
        />
        <MoneyStats 
          expected={stats.totalExpectedRevenue} 
          collected={stats.monthlyRevenue} 
        />
      </div>

      {/* 3. CORE FEATURE: UNPAID TENANTS */}
      <UnpaidTenantsList 
        tenants={unpaidTenants} 
        pendingAmount={stats.pendingRevenueAmount}
        onMarkPaid={handleMarkPaid} 
        onSendReminder={handleSendReminder} 
        onSendAllReminders={handleSendAllReminders}
      />

      {/* 4. RECENT ACTIVITY */}
      <RecentActivity activities={stats.recentActivity} />

    </motion.div>
  );
};

export default Dashboard;
