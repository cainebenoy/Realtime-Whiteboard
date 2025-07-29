const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Enable CORS for all routes
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST"],
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store drawing history for new users and undo functionality
let drawingHistory = [];
const MAX_HISTORY_SIZE = 10000; // Prevent memory issues

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send existing drawing history to newly connected user
  if (drawingHistory.length > 0) {
    console.log(`Sending ${drawingHistory.length} drawing events to new user`);
    socket.emit('drawing-history', drawingHistory);
  }

  // Handle drawing events
  socket.on('drawing', (data) => {
    // Store in history for new users
    drawingHistory.push(data);
    
    // Prevent memory overflow by limiting history size
    if (drawingHistory.length > MAX_HISTORY_SIZE) {
      drawingHistory = drawingHistory.slice(-MAX_HISTORY_SIZE); // Keep last N events
      console.log('Drawing history trimmed to prevent memory overflow');
    }
    
    // Broadcast to all other users (not the sender)
    socket.broadcast.emit('drawing', data);
  });

  // Handle undo - remove last batch of drawing events and send complete redraw
  socket.on('undo', () => {
    console.log('Undo requested by:', socket.id);
    
    if (drawingHistory.length > 0) {
      // Find the last continuous stroke by analyzing drawing patterns
      let removeCount = 0;
      const lastEvent = drawingHistory[drawingHistory.length - 1];
      
      // Group by stroke characteristics: color+size for brush, size+isEraser for eraser
      for (let i = drawingHistory.length - 1; i >= 0; i--) {
        const event = drawingHistory[i];
        
        // Check if events belong to the same stroke
        const sameStroke = lastEvent.isEraser && event.isEraser 
          ? (event.size === lastEvent.size) // Eraser: match by size only
          : (!lastEvent.isEraser && !event.isEraser && 
             event.color === lastEvent.color && event.size === lastEvent.size); // Brush: match by color+size
        
        if (sameStroke) {
          removeCount++;
        } else {
          break;
        }
      }
      
      // Remove the stroke
      drawingHistory = drawingHistory.slice(0, drawingHistory.length - removeCount);
      
      console.log(`Removed ${removeCount} drawing events. History now has ${drawingHistory.length} events`);
      
      // Send complete redraw to all users
      io.emit('complete-redraw', drawingHistory);
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

// Serve the React app for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
