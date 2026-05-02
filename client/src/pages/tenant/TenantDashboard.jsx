import React, { useState, useEffect } from 'react';
import DashboardService from '../../services/dashboardService';
import { CreditCard, AlertTriangle, ArrowRight, MessageSquare, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const TenantDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await DashboardService.getStats();
        setData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.tenant) {
    return <div className="text-center mt-10 font-bold text-gray-500 dark:text-gray-400">Error loading dashboard</div>;
  }

  const { tenant, currentPayment, alerts, room } = data;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      
      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <div key={idx} className={`p-4 rounded-xl flex items-start gap-3 border ${
              alert.type === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-700' :
              alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
              <p className="font-bold text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rent Status Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-indigo-100 font-medium mb-1">Current Rent Due</p>
            <h2 className="text-4xl font-black">₹{currentPayment ? currentPayment.total : tenant.rentAmount}</h2>
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
            currentPayment?.status === 'Paid' ? 'bg-green-400/20 text-green-300 border border-green-400/30' :
            currentPayment?.status === 'Overdue' ? 'bg-rose-400/20 text-rose-300 border border-rose-400/30' :
            'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
          }`}>
            {currentPayment?.status || 'No Bill Yet'}
          </div>
        </div>

        {currentPayment?.status !== 'Paid' && (
          <p className="text-indigo-100 text-sm font-medium flex items-center gap-2 mb-6">
            <AlertTriangle size={16} /> Due by 5th {format(new Date(), 'MMM yyyy')}
          </p>
        )}

        <button 
          onClick={() => navigate('/rent')}
          className="w-full bg-white dark:bg-slate-800 text-indigo-600 font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-gray-50 dark:bg-slate-900/50 transition-colors"
        >
          {currentPayment?.status === 'Paid' ? 'View Receipt' : 'Pay Rent Now'} <ArrowRight size={18} />
        </button>
      </div>

      {/* Room Details & Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Room Info</p>
          <p className="text-xl font-black text-gray-800 dark:text-gray-100">{room?.roomNumber || 'N/A'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{room?.type || 'Standard'} • Floor {room?.floor || 1}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Move In</p>
          <p className="text-lg font-black text-gray-800 dark:text-gray-100">{format(new Date(tenant.moveInDate), 'dd MMM yyyy')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Deposit: ₹{tenant.deposit}</p>
        </div>
      </div>

      {/* Actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 px-1">Quick Actions</h3>
        <div className="space-y-3">
          <Link to="/complaints" className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform"><MessageSquare size={20} /></div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">Raise Complaint</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Plumbing, electrical, etc.</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
          </Link>
          <button onClick={() => navigate('/alerts')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl group-hover:scale-110 transition-transform"><AlertTriangle size={20} /></div>
              <div className="text-left">
                <p className="font-bold text-gray-800 dark:text-gray-100">Give Notice</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Plan your move out (15 days)</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-yellow-500 transition-colors" />
          </button>
        </div>
      </div>
      
    </motion.div>
  );
};

export default TenantDashboard;
