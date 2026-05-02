import React, { useState, useEffect, useContext } from 'react';
import DashboardService from '../services/dashboardService';
import { AuthContext } from '../context/AuthContext';
import { Users, Home, DollarSign, AlertCircle, Lightbulb, ArrowRight, Clock, AlertTriangle, FileText, CheckCircle2, Megaphone } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [stats, setStats] = useState({ 
    totalRooms: 0, occupiedRooms: 0, activeTenants: 0, monthlyRevenue: 0,
    pendingRevenueAmount: 0, totalExpectedRevenue: 0, unpaidRentsCount: 0,
    pendingComplaintsCount: 0, roomStatusData: [], paymentStatusData: [], 
    revenueData: [], recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await DashboardService.getStats();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const roomColors = ['#10b981', '#f59e0b', '#ef4444']; 
  const paymentColors = ['#10b981', '#ef4444']; 

  const collectionPercentage = stats.totalExpectedRevenue > 0 
    ? Math.round((stats.monthlyRevenue / stats.totalExpectedRevenue) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-64 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm h-32"></div>)}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.welcome')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">{user?.name}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('dashboard.overview')}</p>
        </div>
      </div>
      
      {/* 1. MONEY CARDS (Top) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dashboard.revenue')} value={`₹${stats.monthlyRevenue}`} icon={<DollarSign size={24} className="text-indigo-600" />} iconBg="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50" delay={0.1} />
        <StatCard title={t('dashboard.pending')} value={`₹${stats.pendingRevenueAmount}`} icon={<DollarSign size={24} className="text-rose-600" />} iconBg="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50" delay={0.2} />
        <StatCard title={t('sidebar.rooms')} value={stats.totalRooms} icon={<Home size={24} className="text-indigo-600" />} iconBg="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50" delay={0.3} />
        <StatCard title={t('dashboard.activeTenants')} value={stats.activeTenants} icon={<Users size={24} className="text-emerald-600" />} iconBg="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50" delay={0.4} />
      </div>

      {/* 2. UNPAID TENANTS & ALERTS (Immediately below) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.unpaidRentsCount > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400"><AlertTriangle size={20} /></div>
              <h3 className="font-bold text-rose-900 dark:text-rose-100">Unpaid Rents</h3>
            </div>
            <p className="text-sm text-rose-700 dark:text-rose-300 mb-4">You have <strong className="font-extrabold">{stats.unpaidRentsCount}</strong> pending rent payments totaling <strong className="font-extrabold">₹{stats.pendingRevenueAmount}</strong>.</p>
            <Link to="/payments" className="text-sm font-bold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center group mt-auto">
              Follow up now <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {stats.pendingComplaintsCount > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-3xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400"><AlertCircle size={20} /></div>
              <h3 className="font-bold text-amber-900 dark:text-amber-100">Pending Complaints</h3>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4"><strong className="font-extrabold">{stats.pendingComplaintsCount}</strong> unresolved complaints require your immediate attention.</p>
            <Link to="/complaints" className="text-sm font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center group mt-auto">
              View complaints <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {/* COLLECTION PROGRESS */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-3xl p-5 shadow-sm md:col-span-1 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Monthly Collection</h3>
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{collectionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700/50 rounded-full h-4 mb-3 overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${collectionPercentage}%` }} transition={{ duration: 1, ease: "easeOut" }}
              className={`h-4 rounded-full ${collectionPercentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
            ></motion.div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-right">₹{stats.monthlyRevenue} collected of ₹{stats.totalExpectedRevenue}</p>
        </motion.div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><span className="text-xl">⚡</span> Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/tenants" className="flex flex-col items-center justify-center p-5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:shadow-md transition-all active:scale-95 group border border-indigo-100 dark:border-indigo-800/30">
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <span className="font-bold text-sm">Add Tenant</span>
          </Link>
          <Link to="/payments" className="flex flex-col items-center justify-center p-5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:shadow-md transition-all active:scale-95 group border border-emerald-100 dark:border-emerald-800/30">
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
            <span className="font-bold text-sm">Collect Rent</span>
          </Link>
          <Link to="/rooms" className="flex flex-col items-center justify-center p-5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:shadow-md transition-all active:scale-95 group border border-amber-100 dark:border-amber-800/30">
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Home size={24} />
            </div>
            <span className="font-bold text-sm">Manage Rooms</span>
          </Link>
          <Link to="/announcements" className="flex flex-col items-center justify-center p-5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:shadow-md transition-all active:scale-95 group border border-purple-100 dark:border-purple-800/30">
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Megaphone size={24} />
            </div>
            <span className="font-bold text-sm">Announce</span>
          </Link>
        </div>
      </motion.div>

      {/* 4. RECENT ACTIVITY & INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT ACTIVITY FEED */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-3xl p-6 shadow-sm flex flex-col h-[400px]"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><span className="text-xl">📜</span> Recent Activity</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
            {stats.recentActivity?.length > 0 ? stats.recentActivity.map((activity, idx) => (
              <div key={activity.id} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className={`p-2.5 rounded-2xl ${activity.type === 'Payment' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                    {activity.type === 'Payment' ? <DollarSign size={18} /> : <FileText size={18} />}
                  </div>
                  {idx !== stats.recentActivity.length - 1 && <div className="w-px h-full bg-gray-100 dark:bg-slate-700/50 mt-2"></div>}
                </div>
                <div className="pb-4 pt-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{activity.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <Clock size={12} /> {format(new Date(activity.date), 'dd MMM, hh:mm a')}
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No recent activity found.</p>
            )}
          </div>
        </motion.div>

        {/* KEY INSIGHTS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 shadow-md text-white flex flex-col h-[400px] border border-indigo-500/30"
        >
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb size={24} className="text-indigo-200" />
            <h2 className="text-xl font-bold">Key Insights</h2>
          </div>
          <ul className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {stats.roomStatusData?.find(r => r.name === 'Vacant')?.value > 0 && (
              <li className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                <div className="bg-indigo-500/80 p-2 rounded-xl mt-0.5"><Home size={18} /></div>
                <p className="text-sm text-indigo-50 leading-relaxed">You have <strong className="text-white text-base">{stats.roomStatusData.find(r => r.name === 'Vacant').value} vacant rooms</strong>. Consider listing them on local directories to boost occupancy.</p>
              </li>
            )}
            {stats.unpaidRentsCount > 0 && (
              <li className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                <div className="bg-rose-500/80 p-2 rounded-xl mt-0.5"><DollarSign size={18} /></div>
                <p className="text-sm text-indigo-50 leading-relaxed">Follow up on <strong className="text-white text-base">{stats.unpaidRentsCount} unpaid rents</strong> to collect ₹{stats.pendingRevenueAmount} and reach 100% collection.</p>
              </li>
            )}
            {stats.pendingComplaintsCount === 0 ? (
              <li className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                <div className="bg-emerald-500/80 p-2 rounded-xl mt-0.5"><CheckCircle2 size={18} /></div>
                <p className="text-sm text-indigo-50 leading-relaxed">Great job! All tenant complaints have been resolved.</p>
              </li>
            ) : (
              <li className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                <div className="bg-amber-500/80 p-2 rounded-xl mt-0.5"><AlertCircle size={18} /></div>
                <p className="text-sm text-indigo-50 leading-relaxed">Resolve the <strong className="text-white text-base">{stats.pendingComplaintsCount} pending complaints</strong> to improve tenant satisfaction.</p>
              </li>
            )}
          </ul>
        </motion.div>
      </div>

      {/* 5. GRAPHS (LAST) */}
      <div className="space-y-6 pt-6 mt-4 border-t border-gray-200/50 dark:border-slate-800">
        <div className="flex items-center gap-2 px-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analytics & Trends</h2>
          <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold border border-gray-200 dark:border-slate-700">Optional</span>
        </div>
        
        {/* Revenue Trend Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700/50 flex flex-col group"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Trend (6 Months)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.2)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `₹${value}`} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', background: 'var(--tw-colors-white)' }} formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Occupancy Donut */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700/50 flex flex-col group"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('dashboard.occupancy') || 'Room Occupancy'}</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.roomStatusData} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {stats.roomStatusData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={roomColors[index % roomColors.length]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Payment Collection Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700/50 flex flex-col group"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Payment Status</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.paymentStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(156,163,175,0.2)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: '600', fontSize: 13}} width={80} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                    {stats.paymentStatusData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={paymentColors[index % paymentColors.length]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon, iconBg, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700/50 flex items-center justify-between group cursor-pointer"
  >
    <div className="relative z-10">
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <motion.h3 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: delay + 0.2 }}
        className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight"
      >
        {value}
      </motion.h3>
    </div>
    <div className={`p-3.5 rounded-2xl shadow-sm relative z-10 ${iconBg} transform group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
  </motion.div>
);

export default Dashboard;
