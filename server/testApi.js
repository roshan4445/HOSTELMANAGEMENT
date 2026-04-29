const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@demo.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    // Add a room
    await axios.post('http://localhost:5000/api/rooms', {
      roomNumber: '999',
      type: 'AC',
      capacity: 1,
      rentAmount: 1000
    }, config);
    
    // Fetch rooms
    const roomsRes = await axios.get('http://localhost:5000/api/rooms', config);
    const newRoom = roomsRes.data.find(r => r.roomNumber === '999');
    
    console.log('New Room:', newRoom);
    console.log('Status included?', newRoom.status);
    console.log('Filtered in Tenants?', newRoom.status !== 'Occupied');
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}

test();
