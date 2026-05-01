import React, { useState, useEffect } from 'react';
import AnnouncementService from '../../services/announcementService';
import TenantService from '../../services/tenantService';
import socket, { connectSocket } from '../../socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Megaphone, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const TenantAlerts = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeDate, setNoticeDate] = useState('');
  
  const todayDate = new Date();
  const minNoticeDateObj = new Date();
  minNoticeDateObj.setDate(todayDate.getDate() + 15);
  const minNoticeDateStr = minNoticeDateObj.toISOString().split('T')[0];

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await AnnouncementService.getAll();
        setAnnouncements(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      connectSocket();
      // Tenant joins their own room (this should already happen but ensuring it's joined)
      if (userInfo.role === 'tenant' && userInfo.tenantId) {
        socket.emit('join-tenant', userInfo.tenantId, userInfo.ownerId);
      }

      socket.on('announcement-new', (newAnn) => {
        setAnnouncements(prev => [newAnn, ...prev]);
        toast.success(`New Announcement: ${newAnn.title}`, { icon: '📣' });
      });
    }

    return () => {
      socket.off('announcement-new');
    };
  }, []);

  const handleGiveNotice = async (e) => {
    e.preventDefault();
    try {
      await TenantService.giveNotice('self', noticeDate);
      toast.success('Notice submitted successfully!');
      setShowNoticeModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting notice');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      
      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl shadow-yellow-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1"><AlertTriangle size={24} /> Planning to move out?</h2>
          <p className="text-yellow-100 text-sm font-medium">As per policy, a 15-day prior notice is mandatory.</p>
        </div>
        <button onClick={() => setShowNoticeModal(true)} className="bg-white text-yellow-600 font-bold px-6 py-3 rounded-xl shadow-md w-full sm:w-auto hover:bg-yellow-50 transition-colors whitespace-nowrap">
          Give Notice
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-4">
          <Megaphone className="text-indigo-600" /> Announcements
        </h1>
        
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann._id} className={`bg-white p-5 rounded-3xl shadow-sm border-l-4 ${
              ann.priority === 'High' ? 'border-l-rose-500' :
              ann.priority === 'Medium' ? 'border-l-yellow-500' : 'border-l-indigo-500'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800">{ann.title}</h3>
                <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{ann.message}</p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-10 bg-white rounded-3xl border border-gray-100">
               <Bell size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No announcements from the PG owner.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNoticeModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl pb-safe"
            >
              <h2 className="text-xl font-bold mb-2 text-gray-800">Submit Move-out Notice</h2>
              <p className="text-sm text-gray-500 mb-6">Select a date at least 15 days from today.</p>
              <form onSubmit={handleGiveNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Move-out Date</label>
                  <input required type="date" min={minNoticeDateStr} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/20" value={noticeDate} onChange={e => setNoticeDate(e.target.value)} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNoticeModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3.5 bg-yellow-500 text-white font-bold rounded-xl shadow-md hover:bg-yellow-600 transition-colors flex justify-center items-center gap-2">
                    Submit <Send size={16} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TenantAlerts;
