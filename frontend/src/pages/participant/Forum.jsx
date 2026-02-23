import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  Avatar,
  CircularProgress,
  Chip,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as BackIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { socket, connectSocket } from '../../services/socket';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Forum = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  
  const [event, setEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchEvent();
    fetchMessages();
    
    // Connect to socket
    connectSocket();
    socket.emit('joinForum', eventId);

    // Listen for new messages
    socket.on('forumMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('messageDeleted', (messageId) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    return () => {
      socket.emit('leaveForum', eventId);
      socket.off('forumMessage');
      socket.off('messageDeleted');
    };
  }, [eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/forum/${eventId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('sendForumMessage', {
      eventId,
      content: newMessage,
      userId: user.id,
      userName: user.name
    });

    setNewMessage('');
  };

  const handleMenuOpen = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    try {
      await api.delete(`/forum/messages/${selectedMessage._id}`);
      socket.emit('deleteForumMessage', { eventId, messageId: selectedMessage._id });
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
    handleMenuClose();
  };

  const handleReportMessage = async () => {
    try {
      await api.post(`/forum/messages/${selectedMessage._id}/report`);
      toast.success('Message reported');
    } catch (error) {
      toast.error('Failed to report message');
    }
    handleMenuClose();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <BackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {event?.title || 'Event'} Forum
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discussion for registered participants
            </Typography>
          </Box>
          <Chip label="Live" color="success" size="small" />
        </CardContent>
      </Card>

      {/* Messages */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">
                No messages yet. Start the discussion!
              </Typography>
            </Box>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <Box key={date}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Chip label={date} size="small" variant="outlined" />
                </Box>
                <List disablePadding>
                  {dateMessages.map((message, index) => {
                    const isOwn = message.user?._id === user?.id || message.userId === user?.id;
                    const isOrganizer = message.user?.role === 'organizer';
                    
                    return (
                      <ListItem
                        key={message._id || index}
                        sx={{
                          flexDirection: 'column',
                          alignItems: isOwn ? 'flex-end' : 'flex-start',
                          py: 0.5
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: isOwn ? 'row-reverse' : 'row',
                            alignItems: 'flex-start',
                            gap: 1,
                            maxWidth: '85%'
                          }}
                        >
                          {!isOwn && (
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                fontSize: '0.75rem',
                                bgcolor: isOrganizer ? 'primary.main' : 'grey.400'
                              }}
                            >
                              {(message.user?.name || message.userName || 'U').charAt(0)}
                            </Avatar>
                          )}
                          <Box sx={{ flex: 1 }}>
                            {!isOwn && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, mb: 0.5 }}>
                                <Typography variant="caption" fontWeight={500}>
                                  {message.user?.name || message.userName}
                                </Typography>
                                {isOrganizer && (
                                  <Chip label="Organizer" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                                )}
                              </Box>
                            )}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 0.5
                              }}
                            >
                              <Box
                                sx={{
                                  bgcolor: isOwn 
                                    ? 'primary.main' 
                                    : isOrganizer 
                                      ? 'primary.50' 
                                      : 'grey.100',
                                  color: isOwn ? 'white' : 'text.primary',
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2,
                                  borderTopRightRadius: isOwn ? 0 : 2,
                                  borderTopLeftRadius: isOwn ? 2 : 0,
                                  flex: 1
                                }}
                              >
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {message.content}
                                </Typography>
                              </Box>
                              {(isOwn || user?.role === 'organizer' || user?.role === 'admin') && (
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleMenuOpen(e, message)}
                                  sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                                >
                                  <MoreIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', textAlign: isOwn ? 'right' : 'left', mt: 0.5, mx: 1 }}
                            >
                              {formatTime(message.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoComplete="off"
            multiline
            maxRows={4}
          />
          <Button 
            type="submit" 
            variant="contained"
            disabled={!newMessage.trim()}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Card>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {(selectedMessage?.user?._id === user?.id || 
          selectedMessage?.userId === user?.id ||
          user?.role === 'organizer' ||
          user?.role === 'admin') && (
          <MenuItem onClick={handleDeleteMessage}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
        {selectedMessage?.user?._id !== user?.id && selectedMessage?.userId !== user?.id && (
          <MenuItem onClick={handleReportMessage}>
            <FlagIcon fontSize="small" sx={{ mr: 1 }} />
            Report
          </MenuItem>
        )}
      </Menu>
    </Container>
  );
};

export default Forum;
