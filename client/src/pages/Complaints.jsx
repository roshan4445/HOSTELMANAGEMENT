import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchComplaints = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('https://hostelmanagement-rss4.onrender.com/api/complaints', config);
      setComplaints(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    
    // Poll every 30 seconds to fetch new complaints dynamically if the user stays on the page
    const interval = setInterval(fetchComplaints, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`https://hostelmanagement-rss4.onrender.com/api/complaints/${id}`, { status: newStatus }, config);
      toast.success('Complaint status updated successfully!');
      fetchComplaints();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
          <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[500px]"></div>
      </div>
    );
  }

  const filteredComplaints = complaints.filter(c => filterStatus === 'All' || c.status === filterStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Complaints</h1>
          <p className="text-gray-500 mt-1">Manage tenant maintenance requests synced from Google Forms.</p>
        </div>
        
        <select 
          className="p-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer w-full sm:w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6 overflow-hidden"
      >
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-10">
            <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No complaints found.</p>
          </div>
        ) : (
          <motion.div 
            className="space-y-4"
            initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          >
            {filteredComplaints.map(complaint => (
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2, scale: 1.005 }}
                transition={{ duration: 0.2 }}
                key={complaint._id} 
                className={`p-5 rounded-xl border-l-[5px] shadow-sm hover:shadow-lg transition-all duration-300 bg-white/60 backdrop-blur-sm border border-gray-100 border-l-solid ${
                  complaint.priority === 'High' ? 'border-l-red-500' :
                  complaint.priority === 'Medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                  <div className="mb-4 lg:mb-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{complaint.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold shadow-sm text-white ${
                        complaint.priority === 'High' ? 'bg-red-500' :
                        complaint.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {complaint.priority} Priority
                      </span>
                      <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-md text-xs font-semibold shadow-sm">
                        {complaint.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 max-w-3xl">{complaint.description}</p>
                    
                    <div className="flex flex-wrap items-center text-xs text-gray-500 gap-3">
                      <span><span className="font-semibold text-gray-700">Tenant:</span> {complaint.name} (Room {complaint.roomNumber})</span>
                      <span><span className="font-semibold text-gray-700">Phone:</span> {complaint.phone || 'N/A'}</span>
                      <span className="flex items-center"><Clock size={12} className="mr-1"/> {format(new Date(complaint.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <motion.select
                      whileTap={{ scale: 0.97 }}
                      className={`p-2 rounded-xl text-sm font-semibold border shadow-sm outline-none cursor-pointer transition-all ${
                        complaint.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-2 focus:ring-green-500/20' :
                        complaint.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-2 focus:ring-indigo-500/20' : 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-2 focus:ring-yellow-500/20'
                      }`}
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </motion.select>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Complaints;
