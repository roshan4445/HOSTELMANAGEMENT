import React, { useState, useEffect, useContext } from 'react';
import DashboardService from '../services/dashboardService';
import { AuthContext } from '../context/AuthContext';
import { Users, Home, DollarSign, AlertCircle, Lightbulb, ArrowRight, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
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
          {[1,2,3,4].map(i => <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-32"></div>)}
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
      </div>
      
      {/* 1. ACTION CENTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.unpaidRentsCount > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><AlertTriangle size={20} /></div>
              <h3 className="font-bold text-rose-900">Unpaid Rents</h3>
            </div>
            <p className="text-sm text-rose-700 mb-4">You have <strong className="font-extrabold">{stats.unpaidRentsCount}</strong> pending rent payments totaling <strong className="font-extrabold">₹{stats.pendingRevenueAmount}</strong>.</p>
            <Link to="/payments" className="text-sm font-bold text-rose-700 hover:text-rose-800 flex items-center group">
              Follow up now <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {stats.pendingComplaintsCount > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><AlertCircle size={20} /></div>
              <h3 className="font-bold text-amber-900">Pending Complaints</h3>
            </div>
            <p className="text-sm text-amber-700 mb-4"><strong className="font-extrabold">{stats.pendingComplaintsCount}</strong> unresolved complaints require your immediate attention.</p>
            <Link to="/complaints" className="text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center group">
              View complaints <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {/* 2. COLLECTION PROGRESS */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-5 shadow-sm md:col-span-1 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-bold text-gray-900">Monthly Collection</h3>
            <span className="text-2xl font-black text-indigo-600">{collectionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${collectionPercentage}%` }} transition={{ duration: 1, ease: "easeOut" }}
              className={`h-3 rounded-full ${collectionPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            ></motion.div>
          </div>
          <p className="text-xs text-gray-500 font-medium text-right">₹{stats.monthlyRevenue} collected of ₹{stats.totalExpectedRevenue}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Rooms" value={stats.totalRooms} icon={<Home size={24} className="text-indigo-600" />} iconBg="bg-indigo-50 border border-indigo-100" delay={0.1} />
        <StatCard title="Active Tenants" value={stats.activeTenants} icon={<Users size={24} className="text-emerald-600" />} iconBg="bg-emerald-50 border border-emerald-100" delay={0.2} />
        <StatCard title="Monthly Revenue" value={`₹${stats.monthlyRevenue}`} icon={<DollarSign size={24} className="text-indigo-600" />} iconBg="bg-indigo-50 border border-indigo-100" delay={0.3} />
        <StatCard title="Pending Revenue" value={`₹${stats.pendingRevenueAmount}`} icon={<DollarSign size={24} className="text-rose-600" />} iconBg="bg-rose-50 border border-rose-100" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Trend Area Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (6 Months)</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `₹${value}`} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Room Occupancy Donut */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-6">Room Occupancy</h2>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.roomStatusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
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

            {/* Payment Collection Donut */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-6">Payment Status</h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.paymentStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontWeight: '600', fontSize: 13}} width={80} />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
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

        <div className="space-y-6">
          {/* 3. KEY INSIGHTS */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-indigo-600 rounded-2xl p-6 shadow-md text-white"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={20} className="text-indigo-200" />
              <h2 className="text-lg font-bold">Key Insights</h2>
            </div>
            <ul className="space-y-4">
              {stats.roomStatusData?.find(r => r.name === 'Vacant')?.value > 0 && (
                <li className="flex items-start gap-3">
                  <div className="bg-indigo-500/50 p-1.5 rounded-md mt-0.5"><Home size={14} /></div>
                  <p className="text-sm text-indigo-100 leading-tight">You have <strong>{stats.roomStatusData.find(r => r.name === 'Vacant').value} vacant rooms</strong>. Consider listing them on local directories to boost occupancy.</p>
                </li>
              )}
              {stats.unpaidRentsCount > 0 && (
                <li className="flex items-start gap-3">
                  <div className="bg-indigo-500/50 p-1.5 rounded-md mt-0.5"><DollarSign size={14} /></div>
                  <p className="text-sm text-indigo-100 leading-tight">Follow up on <strong>{stats.unpaidRentsCount} unpaid rents</strong> to collect ₹{stats.pendingRevenueAmount} and reach 100% collection.</p>
                </li>
              )}
              {stats.pendingComplaintsCount === 0 ? (
                <li className="flex items-start gap-3">
                  <div className="bg-emerald-500/80 p-1.5 rounded-md mt-0.5"><CheckCircle2 size={14} /></div>
                  <p className="text-sm text-indigo-100 leading-tight">Great job! All tenant complaints have been resolved.</p>
                </li>
              ) : (
                <li className="flex items-start gap-3">
                  <div className="bg-indigo-500/50 p-1.5 rounded-md mt-0.5"><AlertCircle size={14} /></div>
                  <p className="text-sm text-indigo-100 leading-tight">Resolve the <strong>{stats.pendingComplaintsCount} pending complaints</strong> to improve tenant satisfaction.</p>
                </li>
              )}
            </ul>
          </motion.div>

          {/* 4. RECENT ACTIVITY FEED */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col h-[500px]"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-5">
              {stats.recentActivity?.length > 0 ? stats.recentActivity.map((activity, idx) => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${activity.type === 'Payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {activity.type === 'Payment' ? <DollarSign size={16} /> : <FileText size={16} />}
                    </div>
                    {idx !== stats.recentActivity.length - 1 && <div className="w-px h-full bg-gray-100 mt-2"></div>}
                  </div>
                  <div className="pb-4">
                    <h4 className="text-sm font-bold text-gray-900">{activity.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <Clock size={10} /> {format(new Date(activity.date), 'dd MMM, hh:mm a')}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-10">No recent activity found.</p>
              )}
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
    className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex items-center justify-between group cursor-pointer"
  >
    <div className="relative z-10">
      <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
      <motion.h3 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: delay + 0.2 }}
        className="text-3xl font-extrabold text-gray-900 tracking-tight"
      >
        {value}
      </motion.h3>
    </div>
    <div className={`p-3.5 rounded-xl shadow-sm relative z-10 ${iconBg} transform group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
  </motion.div>
);

export default Dashboard;
