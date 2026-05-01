import React, { useState, useEffect } from 'react';
import PaymentService from '../../services/paymentService';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import socket from '../../socket';

const TenantRent = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [selectedMode, setSelectedMode] = useState('UPI');

  const fetchPayments = async () => {
    try {
      const result = await PaymentService.getAll({ limit: 500 });
      setPayments(result.data || result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Real-time: connect socket and join tenant room
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      socket.connect();
      socket.emit('join-tenant', userInfo._id);

      socket.on('payment-updated', (updatedPayment) => {
        setPayments(prev =>
          prev.map(p => p._id === updatedPayment._id ? updatedPayment : p)
        );
        toast.success('Your payment status has been updated!');
      });
    }

    return () => {
      socket.off('payment-updated');
      socket.disconnect();
    };
  }, []);

  const handlePayRent = async (paymentId) => {
    setPayingId(paymentId);
    try {
      await PaymentService.markPaid(paymentId, selectedMode);
      toast.success('🎉 Rent paid successfully! Admin has been notified.');
      setShowConfirm(null);
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rent History</h1>
        <p className="text-sm text-gray-500 font-medium">View and manage your rent payments</p>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <motion.div
            key={payment._id}
            layout
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden"
          >
            {payment.status === 'Paid' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}
            {payment.status === 'Overdue' && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>}
            {payment.status === 'Unpaid' && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}
            
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800 text-lg">{format(new Date(payment.year, payment.month - 1), 'MMMM yyyy')}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Due: {format(new Date(payment.dueDate), 'dd MMM yyyy')}</p>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                payment.status === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                payment.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {payment.status === 'Paid' && <CheckCircle size={14} />}
                {payment.status === 'Overdue' && <AlertTriangle size={14} />}
                {payment.status === 'Unpaid' && <Clock size={14} />}
                {payment.status}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Amount</p>
                <p className="text-lg font-black text-gray-800">₹{payment.total}</p>
                {payment.fine > 0 && <p className="text-[10px] text-rose-500 font-bold mt-0.5">Includes ₹{payment.fine} fine</p>}
              </div>
              {payment.status === 'Paid' ? (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Paid On</p>
                  <p className="text-sm font-bold text-gray-800">{payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yyyy') : '-'}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">{payment.paymentMode}</p>
                </div>
              ) : (
                <div className="flex justify-end items-center">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowConfirm(payment._id); setSelectedMode('UPI'); }}
                    disabled={payingId === payment._id}
                    className={`bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-sm hover:bg-indigo-700 transition-colors w-full flex items-center justify-center gap-2 ${payingId === payment._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <CreditCard size={16} />
                    {payingId === payment._id ? 'Processing...' : 'Pay Now'}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {payments.length === 0 && (
          <div className="text-center py-10 bg-white rounded-3xl border border-gray-100">
            <p className="text-gray-500 font-medium">No rent history found.</p>
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-2xl w-full max-w-[380px] shadow-xl"
            >
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="text-indigo-600" size={28} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Confirm Payment</h2>
                <p className="text-sm text-gray-500 mt-1">
                  ₹{payments.find(p => p._id === showConfirm)?.total || 0} rent for{' '}
                  {(() => {
                    const found = payments.find(p => p._id === showConfirm);
                    return found ? format(new Date(found.year, found.month - 1), 'MMMM yyyy') : '';
                  })()}
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Payment Mode</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-2 ml-1">💡 Razorpay integration coming soon</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePayRent(showConfirm)}
                  disabled={payingId}
                  className={`flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors ${payingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {payingId ? 'Paying...' : 'Confirm & Pay'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TenantRent;
