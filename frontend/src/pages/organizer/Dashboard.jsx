import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Event as EventIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as AttendanceIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    totalAttendance: 0,
    followers: 0
  });
  const [allEvents, setAllEvents] = useState([]);
  const [completedEventsStats, setCompletedEventsStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, eventsRes, completedRes] = await Promise.all([
        api.get('/organizers/stats'),
        api.get('/organizers/events'),
        api.get('/organizers/completed-stats')
      ]);
      
      setStats(statsRes.data);
      setAllEvents(eventsRes.data);
      setCompletedEventsStats(completedRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'published': return 'primary';
      case 'ongoing': return 'warning';
      case 'completed': return 'success';
      case 'closed': return 'error';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}.100`,
              color: `${color}.main`
            }}
          >
            <Icon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            <Typography color="text.secondary">{title}</Typography>
            {subtitle && (
              <Typography variant="caption" color="success.main">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Organizer Dashboard
          </Typography>
          <Typography color="text.secondary">
            Welcome back, {user?.name}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/organizer/events/create')}
          size="large"
        >
          Create Event
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={EventIcon}
            title="Total Events"
            value={stats.totalEvents}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PeopleIcon}
            title="Registrations"
            value={stats.totalRegistrations}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={MoneyIcon}
            title="Revenue"
            value={`₹${stats.totalRevenue}`}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingUpIcon}
            title="Followers"
            value={stats.followers}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Events Carousel */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Your Events
          </Typography>
          <Button onClick={() => navigate('/organizer/events')} endIcon={<ArrowIcon />}>
            View All
          </Button>
        </Box>
        
        {allEvents.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                No events created yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/organizer/events/create')}
                sx={{ mt: 2 }}
              >
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              overflowX: 'auto', 
              pb: 2,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 3 }
            }}
          >
            {allEvents.map((event) => (
              <Card 
                key={event._id} 
                sx={{ minWidth: 280, flexShrink: 0 }}
              >
                <CardActionArea component={Link} to={`/organizer/events/${event._id}`}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Chip 
                        label={event.status} 
                        size="small" 
                        color={getStatusColor(event.status)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip 
                        label={event.eventType} 
                        size="small" 
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      {event.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {new Date(event.startDate).toLocaleDateString()}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Registrations: {event.registrationCount || 0}
                      </Typography>
                      <Typography variant="caption" color="primary">
                        View Details →
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Completed Events Analytics */}
      <Box>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Completed Events Analytics
        </Typography>
        
        {completedEventsStats.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No completed events yet. Analytics will appear here after events are completed.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {completedEventsStats.map((event) => (
              <Grid item xs={12} md={6} key={event._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {event.name}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                          <Typography variant="h5" fontWeight={700} color="primary">
                            {event.registrations || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Registrations
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                          <Typography variant="h5" fontWeight={700} color="success.main">
                            {event.attendance || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Attendance
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.50', borderRadius: 1 }}>
                          <Typography variant="h5" fontWeight={700} color="warning.main">
                            ₹{event.revenue || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Revenue
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                          <Typography variant="h5" fontWeight={700} color="info.main">
                            {event.sales || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.eventType === 'merchandise' ? 'Sales' : 'Teams'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default OrganizerDashboard;
