import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinTeamRoom = (teamId) => {
  socket.emit('joinTeam', teamId);
};

export const leaveTeamRoom = (teamId) => {
  socket.emit('leaveTeam', teamId);
};

export const joinEventForum = (eventId) => {
  socket.emit('joinEventForum', eventId);
};

export const sendTeamMessage = (data) => {
  socket.emit('teamMessage', data);
};

export const sendTypingIndicator = (data) => {
  socket.emit('typing', data);
};

export default socket;
