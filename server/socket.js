const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'];
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Store user payload
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Prevent a user from joining someone else's room
    socket.on('join-owner', (ownerId) => {
      if (socket.user.id !== ownerId) return; // Basic check, though role checks might be needed
      socket.join(`owner-${ownerId}`);
    });

    socket.on('join-tenant', (tenantId, ownerId) => {
      // In a real app, verify that the logged-in user corresponds to this tenant
      socket.join(`tenant-${tenantId}`);
      if (ownerId) {
        socket.join(`pg-${ownerId}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
