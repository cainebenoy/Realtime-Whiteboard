const { Server } = require('socket.io');

let io;
let drawingHistory = [];
const MAX_HISTORY_SIZE = 10000;

module.exports = (req, res) => {
  if (!io) {
    console.log('Initializing Socket.IO server...');
    
    io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Send existing drawing history to new user
      if (drawingHistory.length > 0) {
        socket.emit('drawing-history', drawingHistory);
      }

      // Handle drawing events
      socket.on('drawing', (data) => {
        // Store in history for new users
        if (drawingHistory.length >= MAX_HISTORY_SIZE) {
          drawingHistory.shift(); // Remove oldest drawing
        }
        drawingHistory.push(data);
        
        // Broadcast to all other clients
        socket.broadcast.emit('drawing', data);
      });

      // Handle undo
      socket.on('undo', () => {
        console.log('Undo requested by:', socket.id);
        if (drawingHistory.length > 0) {
          drawingHistory.pop();
          io.emit('canvas-state', drawingHistory);
        }
      });

      // Handle clear canvas
      socket.on('clear-canvas', () => {
        console.log('Clear canvas requested by:', socket.id);
        drawingHistory = [];
        io.emit('clear-canvas');
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};
