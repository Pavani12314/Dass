import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Event as EventIcon,
  ShoppingBag as MerchIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  QrCode as QrIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import EventCard from '../../components/EventCard';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState({
    upcoming: [],
    normal: [],
    merchandise: [],
    completed: [],
    cancelled: []
  });
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  // New state for available events
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetchRegistrations();
    fetchAvailableEvents();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/tickets/my-registrations');
      setRegistrations(response.data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all available events
  const fetchAvailableEvents = async () => {
    try {
      const response = await api.get('/events?limit=6');
      setAvailableEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching available events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const tabs = [
    { label: 'Upcoming', icon: <EventIcon />, key: 'upcoming' },
    { label: 'Normal', icon: <EventIcon />, key: 'normal' },
    { label: 'Merchandise', icon: <MerchIcon />, key: 'merchandise' },
    { label: 'Completed', icon: <CompletedIcon />, key: 'completed' },
    { label: 'Cancelled', icon: <CancelledIcon />, key: 'cancelled' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered': return 'primary';
      case 'confirmed': return 'success';
      case 'attended': return 'success';
      case 'pending-payment': return 'warning';
      case 'payment-approved': return 'success';
      case 'cancelled': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getCurrentData = () => {
    const key = tabs[activeTab].key;
    return registrations[key] || [];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Available Events Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Available Events
        </Typography>
        {loadingEvents ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : availableEvents.length === 0 ? (
          <Typography sx={{ color: '#94a3b8' }}>
            No events available at the moment.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {availableEvents.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <EventCard event={event} linkPrefix="/participant/events" />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Welcome Banner */}
      <Box 
        sx={{ 
          mb: 4,
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            right: 100,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ position: 'relative', zIndex: 1 }}>
          Welcome back, {user?.firstName}! 
        </Typography>
        <Typography sx={{ opacity: 0.9, position: 'relative', zIndex: 1 }}>
          Manage your event registrations and track your participation
        </Typography>
        <Button
          component={Link}
          to="/participant/events"
          variant="contained"
          sx={{ 
            mt: 2, 
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            '&:hover': { background: 'rgba(255,255,255,0.3)' },
            position: 'relative',
            zIndex: 1,
          }}
        >
          Browse Events
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', 
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.5)' },
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <EventIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" fontWeight={700}>
                {registrations.upcoming.length}
              </Typography>
              <Typography sx={{ opacity: 0.9 }}>Upcoming Events</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            sx={{ 
              background: 'rgba(15, 15, 35, 0.85)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 15px 30px rgba(139, 92, 246, 0.3)' },
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <EventIcon sx={{ fontSize: 40, mb: 1, color: '#a78bfa' }} />
              <Typography variant="h3" fontWeight={700} sx={{ color: '#a78bfa' }}>
                {registrations.normal.length}
              </Typography>
              <Typography sx={{ color: '#94a3b8' }}>Registered Events</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{ 
              background: 'rgba(15, 15, 35, 0.85)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 15px 30px rgba(236, 72, 153, 0.3)' },
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <MerchIcon sx={{ fontSize: 40, mb: 1, color: '#f472b6' }} />
              <Typography variant="h3" fontWeight={700} sx={{ color: '#f472b6' }}>
                {registrations.merchandise.length}
              </Typography>
              <Typography sx={{ color: '#94a3b8' }}>Merchandise Orders</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{ 
              background: 'rgba(15, 15, 35, 0.85)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 15px 30px rgba(16, 185, 129, 0.3)' },
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CompletedIcon sx={{ fontSize: 40, mb: 1, color: '#34d399' }} />
              <Typography variant="h3" fontWeight={700} sx={{ color: '#34d399' }}>
                {registrations.completed.length}
              </Typography>
              <Typography sx={{ color: '#94a3b8' }}>Events Attended</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, background: 'rgba(15, 15, 35, 0.85)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: '#94a3b8',
              '&.Mui-selected': {
                color: '#a855f7',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#a855f7',
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={tab.key}
              icon={tab.icon}
              label={`${tab.label} (${registrations[tab.key]?.length || 0})`}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Content */}
      {getCurrentData().length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary" gutterBottom>
            No events found in this category
          </Typography>
          <Button 
            component={Link} 
            to="/participant/events" 
            variant="contained" 
            sx={{ mt: 2 }}
          >
            Browse Events
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Organizer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ticket ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentData().map((reg) => (
                <TableRow key={reg._id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {reg.event?.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={reg.event?.eventType} 
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    {reg.event?.organizer?.name}
                  </TableCell>
                  <TableCell>
                    {reg.event?.startDate && format(new Date(reg.event.startDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {reg.team?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={reg.status} 
                      size="small"
                      color={getStatusColor(reg.status)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      component={Link}
                      to={`/participant/ticket/${reg.ticketId}`}
                      size="small"
                      startIcon={<QrIcon />}
                    >
                      {reg.ticketId}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default ParticipantDashboard;
