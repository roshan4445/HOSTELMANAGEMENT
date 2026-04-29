import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FileText, Plus, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportToCSV';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({ paymentMode: 'UPI' });

  const fetchPayments = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/payments`, config);
      setPayments(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleGenerateRent = () => {
    toast((t) => (
      <div>
        <p className="font-semibold text-gray-800">Generate rent entries for all active tenants for this month?</p>
        <div className="flex justify-end gap-3 mt-4">
          <button 
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors" 
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors" 
            onClick={async () => {
              toast.dismiss(t.id);
              setIsGenerating(true);
              try {
                const token = JSON.parse(localStorage.getItem('userInfo')).token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/payments/generate`, {}, config);
                toast.success(data.message);
                fetchPayments();
              } catch (error) {
                toast.error(error.response?.data?.message || 'Error generating rent');
              }
              setIsGenerating(false);
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { minWidth: '300px', background: '#fff', color: '#333' } });
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/payments/${selectedPayment._id}/pay`, {
        paymentMode: formData.paymentMode
      }, config);
      setShowModal(false);
      toast.success('Payment marked as paid successfully!');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error marking payment');
    }
  };

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setFormData({ paymentMode: 'UPI' });
    setShowModal(true);
  };

  const handleExport = () => {
    const dataToExport = payments.map(p => ({
      TenantName: p.tenant?.name || 'Unknown',
      Room: p.room?.roomNumber || 'N/A',
      Month: p.monthString || `${p.year}-${String(p.month).padStart(2, '0')}`,
      Rent: p.amount,
      Fine: p.fine || 0,
      Total: p.total,
      Status: p.status,
      DueDate: p.dueDate ? format(new Date(p.dueDate), 'dd MMM yyyy') : '-',
      PaymentMode: p.paymentMode || '-',
      PaidAt: p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy hh:mm a') : '-'
    }));
    exportToCSV(dataToExport, 'Rent_Records');
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
            <div className="h-10 bg-gray-200 rounded-xl w-48"></div>
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rent Management</h1>
          <p className="text-gray-500 mt-1">Track and manage monthly rent payments.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={handleExport} className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2.5 bg-white text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <Download size={20} className="mr-2 text-gray-500" /> Export CSV
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
            onClick={async () => {
              try {
                const token = JSON.parse(localStorage.getItem('userInfo')).token;
                await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/payments/test-overdue`, {}, { headers: { Authorization: `Bearer ${token}` } });
                toast.success('Overdue check completed! Refreshing data...');
                fetchData();
              } catch (e) {
                toast.error('Failed to run overdue check');
              }
            }}
            className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2.5 bg-yellow-50 text-yellow-700 font-medium rounded-xl shadow-sm border border-yellow-200 hover:bg-yellow-100 transition-colors"
          >
            Test Overdue Check
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
            onClick={handleGenerateRent} 
            disabled={isGenerating}
            className={`flex-1 sm:flex-none justify-center flex items-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow-sm hover:bg-indigo-700 transition-colors ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus size={20} className="mr-2" /> {isGenerating ? 'Generating...' : 'Generate Monthly Rent'}
          </motion.button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden overflow-x-auto"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Mode</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map(payment => (
              <tr key={payment._id} className={`transition-all duration-300 hover:bg-gray-50 ${payment.status === 'Paid' ? 'bg-green-50' : 'bg-red-50 border-l-4 border-red-400'}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-gray-900 text-base">{payment.tenant?.name || 'Unknown'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                    Room {payment.room?.roomNumber || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-800">{payment.monthString || `${payment.year}-${String(payment.month).padStart(2, '0')}`}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Due: {payment.dueDate ? format(new Date(payment.dueDate), 'dd MMM') : '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-800">₹{payment.total}</div>
                  {payment.fine > 0 && <div className="text-[10px] text-red-500 font-bold uppercase mt-1">Inc. ₹{payment.fine} fine</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md shadow-sm text-white ${
                    payment.status === 'Paid' ? 'bg-green-500' : 
                    payment.status === 'Overdue' ? 'bg-red-500' : 
                    'bg-yellow-500'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.status === 'Paid' ? (
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{payment.paymentMode || 'UPI'}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">{payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yyyy') : '-'}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm font-medium">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payment.status !== 'Paid' && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                      onClick={() => openPaymentModal(payment)} 
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 rounded-md hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      Mark Paid
                    </motion.button>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium text-lg">No rent records found.</p>
                  <p className="text-gray-400 text-sm mt-1">Click 'Generate Monthly Rent' to create entries for all active tenants.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-2xl w-[400px] shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Record Payment</h2>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6 mt-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Tenant</p>
                <p className="font-bold text-gray-800 mb-4">{selectedPayment?.tenant?.name}</p>
                <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Amount Due</p>
                  <p className="font-bold text-indigo-600 text-lg">₹{selectedPayment?.total}</p>
                </div>
              </div>
              <form onSubmit={handleMarkPaid} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Payment Mode</label>
                  <select className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.paymentMode} onChange={e => setFormData({ paymentMode: e.target.value})}>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors">Confirm Paid</motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Payments;
