import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  CircularProgress,
  Chip,
  Button
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { socket, connectSocket } from '../../services/socket';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TeamChat = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  
  const [team, setTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
    fetchMessages();
    
    // Connect to socket
    connectSocket();
    socket.emit('joinTeam', teamId);

    // Listen for new messages
    socket.on('teamMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.emit('leaveTeam', teamId);
      socket.off('teamMessage');
    };
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTeam = async () => {
    try {
      const response = await api.get(`/teams/${teamId}`);
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team');
      navigate('/participant/teams');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/teams/${teamId}/messages`);
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

    socket.emit('sendTeamMessage', {
      teamId,
      content: newMessage,
      userId: user.id,
      userName: user.name
    });

    setNewMessage('');
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
          <IconButton onClick={() => navigate('/participant/teams')}>
            <BackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {team?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {team?.members?.length || 0} members
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {team?.members?.slice(0, 5).map((member, index) => (
              <Avatar
                key={member._id || index}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  bgcolor: `hsl(${index * 60}, 60%, 50%)`
                }}
              >
                {(member.name || 'U').charAt(0)}
              </Avatar>
            ))}
            {team?.members?.length > 5 && (
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'grey.400' }}>
                +{team.members.length - 5}
              </Avatar>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">
                No messages yet. Start the conversation!
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
                            alignItems: 'flex-end',
                            gap: 1,
                            maxWidth: '80%'
                          }}
                        >
                          {!isOwn && (
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                              {(message.user?.name || message.userName || 'U').charAt(0)}
                            </Avatar>
                          )}
                          <Box>
                            {!isOwn && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                {message.user?.name || message.userName}
                              </Typography>
                            )}
                            <Box
                              sx={{
                                bgcolor: isOwn ? 'primary.main' : 'grey.100',
                                color: isOwn ? 'white' : 'text.primary',
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                borderTopRightRadius: isOwn ? 0 : 2,
                                borderTopLeftRadius: isOwn ? 2 : 0
                              }}
                            >
                              <Typography variant="body2">{message.content}</Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', textAlign: isOwn ? 'right' : 'left', mt: 0.5 }}
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
          />
          <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
            <SendIcon />
          </IconButton>
        </Box>
      </Card>
    </Container>
  );
};

export default TeamChat;
