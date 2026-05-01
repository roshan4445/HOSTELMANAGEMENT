import { io } from 'socket.io-client';

const SOCKET_URL = 'https://hostelmanagement-rss4.onrender.com';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionDelay: 2000,
  reconnectionAttempts: 10,
});

// Update token before trying to connect
socket.on('connect_error', (err) => {
  console.error('Socket connect error:', err.message);
});

export const connectSocket = () => {
  const token = localStorage.getItem('token');
  if (token) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }
};

export default socket;
