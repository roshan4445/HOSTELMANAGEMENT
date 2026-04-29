import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Plus, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', priority: 'Low' });

  const fetchAnnouncements = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/announcements`, config);
      setAnnouncements(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load announcements');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/announcements`, formData, config);
      toast.success('Announcement posted successfully!');
      setShowModal(false);
      setFormData({ title: '', message: '', priority: 'Low' });
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error posting announcement');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div>
        <p className="font-semibold text-gray-800">Delete this announcement?</p>
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
                await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/announcements/${id}`, config);
                toast.success('Announcement deleted');
                fetchAnnouncements();
              } catch (error) {
                toast.error('Error deleting announcement');
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { minWidth: '300px', background: '#fff', color: '#333' } });
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
          <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-32"></div>)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Announcements</h1>
          <p className="text-gray-500 mt-1">Broadcast important updates and notices to all tenants.</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)} 
          className="flex items-center w-full sm:w-auto justify-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" /> New Announcement
        </motion.button>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
            <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Announcements</h3>
            <p className="text-gray-500">You haven't posted any announcements yet.</p>
          </div>
        ) : (
          announcements.map((announcement, index) => (
            <motion.div
              key={announcement._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6 relative group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold shadow-sm text-white ${
                    announcement.priority === 'High' ? 'bg-red-500' :
                    announcement.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {announcement.priority} Priority
                  </span>
                </div>
                <button 
                  onClick={() => handleDelete(announcement._id)}
                  className="text-gray-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
                  title="Delete Announcement"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <p className="text-gray-600 mt-2 mb-4 whitespace-pre-wrap">{announcement.message}</p>
              <div className="flex items-center text-xs text-gray-400">
                <Clock size={12} className="mr-1" />
                Posted {format(new Date(announcement.createdAt), 'dd MMM yyyy, hh:mm a')}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">New Announcement</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                    <input 
                      type="text" required
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="E.g., Water Supply Disruption"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                    <select 
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium cursor-pointer"
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="Low">Low (Informational)</option>
                      <option value="Medium">Medium (Important)</option>
                      <option value="High">High (Urgent)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                    <textarea 
                      required rows="4"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium resize-none"
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                      placeholder="Write your announcement details here..."
                    ></textarea>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Post Announcement
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

export default Announcements;
