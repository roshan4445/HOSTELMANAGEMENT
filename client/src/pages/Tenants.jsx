import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '../utils/exportToCSV';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', moveInDate: '', roomId: '', paymentMethod: 'UPI', rentAmount: '', deposit: '', aadhaarImage: '' });
  const [filterStatus, setFilterStatus] = useState('All');
  
  const todayDate = new Date();
  const minDate = new Date();
  minDate.setDate(todayDate.getDate() - 10);
  const maxDate = new Date();
  maxDate.setDate(todayDate.getDate() + 10);
  const minDateStr = minDate.toISOString().split('T')[0];
  const maxDateStr = maxDate.toISOString().split('T')[0];
  const [searchName, setSearchName] = useState('');
  const [filterFeeStatus, setFilterFeeStatus] = useState('All');
  const [filterFloor, setFilterFloor] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [tenantsRes, roomsRes, paymentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/tenants`, config),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/rooms`, config),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/payments`, config)
      ]);
      setTenants(tenantsRes.data);
      setRooms(roomsRes.data.filter(r => r.status !== 'Occupied'));
      setPayments(paymentsRes.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/tenants`, formData, config);
      toast.success('Tenant added successfully!');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding tenant');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'image/png') {
        toast.error('Only PNG images are allowed for Aadhaar Card');
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, aadhaarImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMoveOut = (tenantId) => {
    toast((t) => (
      <div>
        <p className="font-semibold text-gray-800">Are you sure you want to mark this tenant as moved out?</p>
        <div className="flex justify-end gap-3 mt-4">
          <button 
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors" 
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors" 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const token = JSON.parse(localStorage.getItem('userInfo')).token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/tenants/${tenantId}/moveout`, {}, config);
                toast.success('Tenant moved out successfully!');
                fetchData();
              } catch (error) {
                toast.error(error.response?.data?.message || 'Error moving out tenant');
              }
            }}
          >
            Move Out
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { minWidth: '300px', background: '#fff', color: '#333' } });
  };

  const handleExport = () => {
    const dataToExport = tenants.map(t => ({
      Name: t.name,
      Phone: t.phone,
      Email: t.email,
      Room: t.room?.roomNumber || 'N/A',
      Floor: t.room?.floor || 1,
      MoveInDate: t.moveInDate ? format(new Date(t.moveInDate), 'yyyy-MM-dd') : '-',
      MoveOutDate: t.moveOutDate ? format(new Date(t.moveOutDate), 'yyyy-MM-dd') : '-',
      RentAmount: t.rentAmount,
      Deposit: t.deposit || 0,
      Status: t.status
    }));
    exportToCSV(dataToExport, 'Tenants_List');
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-40"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
            <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
          </div>
        </div>
        <div className="flex gap-4 mb-6">
          <div className="h-11 bg-gray-200 rounded-xl flex-1"></div>
          <div className="h-11 bg-gray-200 rounded-xl w-48"></div>
          <div className="h-11 bg-gray-200 rounded-xl w-48"></div>
          <div className="h-11 bg-gray-200 rounded-xl w-48"></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[500px]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tenants</h1>
          <p className="text-gray-500 mt-1">Manage active tenants and their details.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={handleExport} className="flex-1 sm:flex-none items-center justify-center flex px-4 py-2.5 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <Download size={20} className="mr-2 text-gray-500" /> Export CSV
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={() => setShowModal(true)} className="flex-1 sm:flex-none items-center justify-center flex px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">
            <Plus size={20} className="mr-2" /> Add Tenant
          </motion.button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Search by name..." 
          className="p-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white shadow-sm flex-1 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <select 
          className="p-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white shadow-sm w-48 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="MovedOut">Moved Out</option>
        </select>
        <select 
          className="p-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white shadow-sm w-48 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          value={filterFeeStatus}
          onChange={(e) => setFilterFeeStatus(e.target.value)}
        >
          <option value="All">All Fees</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
        <select 
          className="p-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white shadow-sm w-48 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
        >
          <option value="All">All Floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
          <option value="4">Floor 4</option>
        </select>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden overflow-x-auto"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Move In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Move Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent/Dep</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map(t => {
              const hasPaid = payments.find(p => p.tenant?._id === t._id && p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear());
              return { ...t, hasPaid };
            }).filter(t => {
              if (filterStatus !== 'All' && t.status !== filterStatus) return false;
              if (searchName && !t.name.toLowerCase().includes(searchName.toLowerCase())) return false;
              if (filterFeeStatus !== 'All' && t.status === 'Active') {
                if (filterFeeStatus === 'Paid' && !t.hasPaid) return false;
                if (filterFeeStatus === 'Pending' && t.hasPaid) return false;
              }
              if (filterFloor !== 'All' && t.room?.floor !== Number(filterFloor)) return false;
              return true;
            }).map((tenant) => (
              <tr key={tenant._id} className="hover:bg-gray-50 transition-colors duration-200 group">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold shadow-sm border border-indigo-100 group-hover:scale-105 transition-transform">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors">{tenant.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-800">{tenant.phone}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{tenant.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                      Room {tenant.room?.roomNumber}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                      Floor {tenant.room?.floor || 1}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(tenant.moveInDate), 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tenant.moveOutDate ? format(new Date(tenant.moveOutDate), 'dd MMM yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-800">₹{tenant.rentAmount}</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Dep: ₹{tenant.deposit || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md shadow-sm text-white ${
                    tenant.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tenant.status === 'Active' ? (
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md shadow-sm text-white ${
                      tenant.hasPaid ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {tenant.hasPaid ? 'Paid' : 'Pending'}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {tenant.status === 'Active' && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                      onClick={() => handleMoveOut(tenant._id)} 
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 rounded-md hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      Move Out
                    </motion.button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center overflow-y-auto pt-20 pb-20 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-2xl w-[550px] my-auto shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Add New Tenant</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Name</label>
                    <input required type="text" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Phone</label>
                    <input required type="text" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Email</label>
                  <input type="email" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Move-in Date</label>
                    <input required type="date" min={minDateStr} max={maxDateStr} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.moveInDate} onChange={e => setFormData({...formData, moveInDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Assign Room</label>
                    <select required className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" onChange={e => {
                      const selectedRoom = rooms.find(r => r._id === e.target.value);
                      setFormData({...formData, roomId: e.target.value, rentAmount: selectedRoom ? selectedRoom.rentAmount : ''})
                    }}>
                      <option value="">Select Room</option>
                      {rooms.map(r => <option key={r._id} value={r._id}>Room {r.roomNumber} (₹{r.rentAmount})</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Rent Amount</label>
                    <input required type="number" readOnly value={formData.rentAmount} className="w-full bg-gray-100 border border-gray-200 text-gray-600 rounded-xl px-4 py-3 outline-none cursor-not-allowed transition-all" placeholder="Auto-filled from room" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Deposit / Advance</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" onChange={e => setFormData({...formData, deposit: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Payment Method</label>
                    <select className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Aadhaar Card (PNG)</label>
                    <input type="file" accept="image/png" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" onChange={handleFileChange} />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">Save Tenant</motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Tenants;
