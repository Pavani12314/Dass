import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const type = activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'ongoing' : 'past';
      const response = await api.get('/organizers/events', { params: { type } });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, eventData) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventData);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${selectedEvent._id}`);
      setEvents(events.filter(e => e._id !== selectedEvent._id));
      toast.success('Event deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
    handleMenuClose();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (now < start) return 'info';
    if (now >= start && now <= end) return 'success';
    return 'default';
  };

  const getStatusLabel = (event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (now < start) return 'Upcoming';
    if (now >= start && now <= end) return 'Ongoing';
    return 'Completed';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          My Events
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/organizer/events/create')}
        >
          Create Event
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Upcoming" />
        <Tab label="Ongoing" />
        <Tab label="Past" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" gutterBottom>
              No {activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'ongoing' : 'past'} events
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {activeTab === 0 && "Create your first event to get started"}
            </Typography>
            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/organizer/events/create')}
              >
                Create Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} key={event._id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.2s'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {event.title}
                        </Typography>
                        <Chip
                          label={getStatusLabel(event)}
                          size="small"
                          color={getStatusColor(event)}
                        />
                        <Chip
                          label={event.category}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                      
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {event.description?.substring(0, 150)}...
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Start Date</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatDate(event.startDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Venue</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {event.venue}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Registrations</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {event.registrations?.length || 0} / {event.capacity}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Price</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {event.isPaid ? `₹${event.price}` : 'Free'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <IconButton onClick={(e) => handleMenuOpen(e, event)}>
                      <MoreIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/organizer/events/${selectedEvent?._id}`);
          handleMenuClose();
        }}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/organizer/events/${selectedEvent?._id}/edit`);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Event
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Event
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            await api.put(`/events/${selectedEvent?._id}/publish`);
            toast.success('Event published successfully');
            fetchEvents();
          } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish event');
          }
          handleMenuClose();
        }}>
          <Chip label="Publish" color="success" size="small" sx={{ mr: 1 }} />
          Publish Event
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default MyEvents;
