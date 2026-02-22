const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// Socket.io setup for real-time features
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const organizerRoutes = require('./routes/organizers');
const adminRoutes = require('./routes/admin');
const ticketRoutes = require('./routes/tickets');
const teamRoutes = require('./routes/teams');
const forumRoutes = require('./routes/forum');
const feedbackRoutes = require('./routes/feedback');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/feedback', feedbackRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room for team chat
  socket.on('joinTeam', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`User ${socket.id} joined team room: team_${teamId}`);
  });

  // Join room for event forum
  socket.on('joinEventForum', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`User ${socket.id} joined event forum: event_${eventId}`);
  });

  // Handle team chat messages
  socket.on('teamMessage', (data) => {
    io.to(`team_${data.teamId}`).emit('newTeamMessage', data);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`team_${data.teamId}`).emit('userTyping', data);
  });

  // Handle forum messages
  socket.on('forumMessage', (data) => {
    io.to(`event_${data.eventId}`).emit('newForumMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
