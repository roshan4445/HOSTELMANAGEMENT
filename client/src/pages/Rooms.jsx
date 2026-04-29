import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ roomNumber: '', type: 'Non-AC', capacity: 1, rentAmount: '', floor: 1 });
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterFloor, setFilterFloor] = useState('All');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [roomsRes, paymentsRes] = await Promise.all([
        axios.get('https://hostelmanagement-rss4.onrender.com/api/rooms', config),
        axios.get('https://hostelmanagement-rss4.onrender.com/api/payments', config)
      ]);
      setRooms(roomsRes.data);
      setPayments(paymentsRes.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('userInfo')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('https://hostelmanagement-rss4.onrender.com/api/rooms', formData, config);
      setShowModal(false);
      setFormData({ roomNumber: '', type: 'Non-AC', capacity: 1, rentAmount: '', floor: 1 });
      fetchRooms();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-40"></div>
          <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
        </div>
        <div className="flex gap-4 mb-6">
          <div className="h-11 bg-gray-200 rounded-xl w-40"></div>
          <div className="h-11 bg-gray-200 rounded-xl w-40"></div>
          <div className="h-11 bg-gray-200 rounded-xl w-40"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-48"></div>)}
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rooms</h1>
          <p className="text-gray-500 mt-1">Manage and assign rooms to your tenants.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          className="flex items-center w-full sm:w-auto justify-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" /> Add Room
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <select 
          className="p-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Occupancy</option>
          <option value="Vacant">Vacant</option>
          <option value="Partial">Partial</option>
          <option value="Occupied">Occupied</option>
        </select>

        <select 
          className="p-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="AC">AC</option>
          <option value="Non-AC">Non-AC</option>
        </select>

        <select 
          className="p-2.5 border border-gray-200 text-gray-700 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
      >
        {rooms.filter(room => {
          if (filterStatus !== 'All' && room.status !== filterStatus) return false;
          if (filterType !== 'All' && room.type !== filterType) return false;
          if (filterFloor !== 'All' && room.floor !== Number(filterFloor)) return false;
          return true;
        }).map((room) => (
          <motion.div 
            layout
            key={room._id} 
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            onClick={() => setSelectedRoom(room)}
          >
            <div className="relative z-10 flex justify-between items-start mb-5">
              <h3 className="text-xl font-bold text-gray-900">Room {room.roomNumber}</h3>
              <motion.span 
                layout 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className={`px-2.5 py-1 text-xs font-bold rounded-md shadow-sm ${
                  room.upcomingVacancy?.isLeaving ? 'bg-yellow-400 text-yellow-900' :
                  room.status === 'Vacant' ? 'bg-green-500 text-white' :
                  room.status === 'Occupied' || room.status === 'Full' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                }`}
              >
                {room.upcomingVacancy?.isLeaving ? `${room.occupants?.filter(o => o.noticeGiven)?.length || 1} Bed(s) Avail. from ${new Date(room.upcomingVacancy.availableFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : room.status}
              </motion.span>
            </div>
            <div className="text-gray-600 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span> <span className="font-semibold text-gray-900">{room.type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Floor</span> <span className="font-semibold text-gray-900">{room.floor || 1}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Capacity</span> <span className="font-semibold text-gray-900">{room.occupants.length} / {room.capacity}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rent</span> <span className="font-semibold text-indigo-600">₹{room.rentAmount}</span></div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-2xl w-[450px] shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Add New Room</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Room Number</label>
                  <input required type="text" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Type</label>
                    <select className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="Non-AC">Non-AC</option>
                      <option value="AC">AC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Floor</label>
                    <input required type="number" min="1" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.floor} onChange={e => setFormData({...formData, floor: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Capacity</label>
                    <input required type="number" min="1" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Rent Amount</label>
                    <input required type="number" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={formData.rentAmount} onChange={e => setFormData({...formData, rentAmount: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">Save Room</motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-2xl w-[500px] max-h-[85vh] overflow-y-auto shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Room {selectedRoom.roomNumber} Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Type</p>
                  <p className="font-semibold text-gray-800">{selectedRoom.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Status</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${
                    selectedRoom.upcomingVacancy?.isLeaving ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    selectedRoom.status === 'Vacant' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    selectedRoom.status === 'Occupied' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {selectedRoom.upcomingVacancy?.isLeaving ? `${selectedRoom.occupants?.filter(o => o.noticeGiven)?.length || 1} Bed(s) Avail. from ${new Date(selectedRoom.upcomingVacancy.availableFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : selectedRoom.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Capacity</p>
                  <p className="font-semibold text-gray-800">{selectedRoom.occupants.length} / {selectedRoom.capacity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Rent</p>
                  <p className="font-semibold text-gray-800">₹{selectedRoom.rentAmount}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                Roommates <span className="ml-2 bg-indigo-50 text-indigo-700 border border-indigo-100 py-0.5 px-2.5 rounded-md text-sm font-semibold">{selectedRoom.occupants.length}</span>
              </h3>
              
              {selectedRoom.occupants.length > 0 ? (
                <div className="space-y-3">
                  {selectedRoom.occupants.map(occ => {
                    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                    const payment = payments.find(p => p.tenant?._id === occ._id && p.monthString === currentMonthStr);
                    const status = payment ? payment.status : 'Unpaid';
                    
                    return (
                      <div key={occ._id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-800 text-base mb-1">{occ.name}</p>
                          <p className="text-sm text-gray-500 flex items-center">{occ.phone}</p>
                          <p className="text-xs text-gray-400 mt-1">Since: {new Date(occ.moveInDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                            status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500 font-medium">No one is currently assigned to this room.</p>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <button onClick={() => setSelectedRoom(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Rooms;
