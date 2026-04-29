import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PublicView = () => {
  const { pgName } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualPgName, setActualPgName] = useState('');

  useEffect(() => {
    const fetchPublicRooms = async () => {
      try {
        const { data } = await axios.get(`https://hostelmanagement-rss4.onrender.com/api/rooms/public/${pgName}`);
        setRooms(data.rooms);
        setActualPgName(data.pgName);
        setLoading(false);
      } catch (err) {
        setError('PG not found or no rooms available.');
        setLoading(false);
      }
    };
    fetchPublicRooms();
  }, [pgName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Oops!</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link to="/login" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-16 px-6 text-center shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{actualPgName}</h1>
        <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
          Welcome to our PG. Browse our available and upcoming rooms below. 
        </p>
      </div>

      {/* Rooms Grid */}
      <div className="max-w-6xl mx-auto px-6 mt-12">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Room Availability</h2>
          <span className="text-gray-500 font-medium">{rooms.length} Total Rooms</span>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden" animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          {rooms.map(room => (
            <motion.div 
              key={room._id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative group"
            >
              {room.status === 'Upcoming Vacancy' && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-bl-xl shadow-sm z-10">
                  {room.vacatingBedsCount} Bed(s) Avail. from {new Date(room.availableFrom).toLocaleDateString()}
                </div>
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Room {room.roomNumber}</h3>
                    <p className="text-gray-500 text-sm mt-1">{room.type} • Floor {room.floor}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                    room.status === 'Vacant' ? 'bg-green-100 text-green-700' :
                    room.status === 'Partial' ? 'bg-blue-100 text-blue-700' :
                    room.status === 'Upcoming Vacancy' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {room.status}
                  </span>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Availability</span>
                    <span className={`font-semibold ${room.availableBeds > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                      {room.availableBeds} / {room.capacity} beds open
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Rent Amount</span>
                    <span className="font-bold text-indigo-600 text-lg">₹{room.rentAmount}<span className="text-xs text-gray-400 font-normal">/mo</span></span>
                  </div>
                </div>
              </div>
              
              {/* Highlight bar at bottom based on status */}
              <div className={`h-1.5 w-full ${
                room.status === 'Vacant' ? 'bg-green-400' :
                room.status === 'Partial' ? 'bg-blue-400' :
                room.status === 'Upcoming Vacancy' ? 'bg-yellow-400' :
                'bg-gray-200'
              }`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default PublicView;
