import React, { useState, useEffect } from 'react';
import ComplaintService from '../../services/complaintService';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TenantComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Other', priority: 'Medium' });

  const fetchComplaints = async () => {
    try {
      const data = await ComplaintService.getAll();
      setComplaints(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ComplaintService.create(formData);
      toast.success('Complaint submitted successfully!');
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'Other', priority: 'Medium' });
      fetchComplaints();
    } catch (error) {
      toast.error('Error submitting complaint');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-2xl w-full mb-6"></div>
        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Complaints</h1>
          <p className="text-sm text-gray-500 font-medium">Track and submit maintenance requests</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 p-3 rounded-2xl text-white shadow-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {complaints.map((complaint) => (
          <div key={complaint._id} className={`p-5 rounded-3xl bg-white shadow-sm border ${
            complaint.priority === 'High' ? 'border-rose-100' :
            complaint.priority === 'Medium' ? 'border-yellow-100' : 'border-green-100'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-800 text-lg">{complaint.title}</h3>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                complaint.status === 'Resolved' ? 'bg-green-50 text-green-700' :
                complaint.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700' :
                'bg-yellow-50 text-yellow-700'
              }`}>
                {complaint.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{complaint.description}</p>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold">
                {complaint.category}
              </span>
              <span className="flex items-center text-xs text-gray-400 font-medium">
                <Clock size={12} className="mr-1" /> {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {complaints.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
             <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No complaints raised yet.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl pb-safe"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-800">Raise a Complaint</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Title</label>
                  <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g. Leaking tap" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Description</label>
                  <textarea required rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the issue in detail..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Category</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Priority</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors">Submit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TenantComplaints;
