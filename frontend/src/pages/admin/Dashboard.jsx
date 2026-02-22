import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button
} from '@mui/material';
import {
  Business as ClubIcon,
  People as PeopleIcon,
  Event as EventIcon,
  LockReset as ResetIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalUsers: 0,
    totalEvents: 0,
    pendingResets: 0
  });
  const [recentClubs, setRecentClubs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, clubsRes, eventsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/clubs?limit=5'),
        api.get('/admin/events?limit=5')
      ]);
      
      setStats(statsRes.data);
      setRecentClubs(clubsRes.data);
      setRecentEvents(eventsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, gradient, onClick }) => (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default', 
        transition: 'all 0.3s ease',
        background: gradient 
          ? 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)'
          : 'rgba(15, 15, 35, 0.85)',
        border: gradient ? 'none' : '1px solid rgba(139, 92, 246, 0.2)',
        '&:hover': { 
          transform: 'translateY(-8px)', 
          boxShadow: gradient 
            ? '0 20px 40px rgba(139, 92, 246, 0.4)' 
            : '0 15px 30px rgba(139, 92, 246, 0.3)' 
        },
        ...(gradient && { color: 'white' }),
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: gradient ? 'rgba(255,255,255,0.2)' : 'rgba(139, 92, 246, 0.15)',
              color: gradient ? 'white' : '#a78bfa',
              boxShadow: gradient ? '0 4px 15px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Icon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h3" fontWeight={700} sx={{ color: gradient ? 'white' : '#f1f5f9' }}>
              {value}
            </Typography>
            <Typography sx={{ opacity: gradient ? 0.9 : 1, color: gradient ? 'inherit' : '#94a3b8' }}>
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#a855f7' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ position: 'relative', zIndex: 1 }}>
          Admin Dashboard
        </Typography>
        <Typography sx={{ opacity: 0.9, position: 'relative', zIndex: 1 }}>
          Welcome back, {user?.firstName || 'Admin'}! Manage your platform.
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={ClubIcon}
            title="Total Clubs"
            value={stats.totalClubs}
            color="primary"
            gradient
            onClick={() => navigate('/admin/clubs')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PeopleIcon}
            title="Total Users"
            value={stats.totalUsers}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={EventIcon}
            title="Total Events"
            value={stats.totalEvents}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={ResetIcon}
            title="Pending Resets"
            value={stats.pendingResets}
            color="warning"
            onClick={() => navigate('/admin/password-resets')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Clubs */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(15, 15, 35, 0.85)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#f1f5f9' }}>
                  Recent Clubs
                </Typography>
                <Button size="small" onClick={() => navigate('/admin/clubs')} sx={{ color: '#a855f7' }}>
                  View All
                </Button>
              </Box>

              {recentClubs.length === 0 ? (
                <Typography sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                  No clubs registered yet
                </Typography>
              ) : (
                <List disablePadding>
                  {recentClubs.map((club) => (
                    <ListItem key={club._id} disableGutters sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }}>
                          {club.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={club.name}
                        secondary={club.email}
                        primaryTypographyProps={{ fontWeight: 500, color: '#f1f5f9' }}
                        secondaryTypographyProps={{ color: '#94a3b8' }}
                      />
                      <Chip 
                        label={club.category} 
                        size="small" 
                        variant="outlined"
                        sx={{ textTransform: 'capitalize', borderColor: 'rgba(139, 92, 246, 0.3)', color: '#a5b4fc' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Events */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(15, 15, 35, 0.85)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#f1f5f9' }}>
                  Recent Events
                </Typography>
                <Button size="small" onClick={() => navigate('/admin/events')} sx={{ color: '#a855f7' }}>
                  View All
                </Button>
              </Box>

              {recentEvents.length === 0 ? (
                <Typography sx={{ textAlign: 'center', py: 3, color: '#94a3b8' }}>
                  No events created yet
                </Typography>
              ) : (
                <List disablePadding>
                  {recentEvents.map((event) => (
                    <ListItem key={event._id} disableGutters sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' }}>
                          <EventIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={event.title}
                        secondary={event.organizer?.name || 'Unknown Club'}
                        primaryTypographyProps={{ fontWeight: 500, color: '#f1f5f9' }}
                        secondaryTypographyProps={{ color: '#94a3b8' }}
                      />
                      <Chip 
                        label={new Date(event.startDate).toLocaleDateString()} 
                        size="small" 
                        variant="outlined"
                        sx={{ borderColor: 'rgba(236, 72, 153, 0.3)', color: '#f472b6' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card sx={{ background: 'rgba(15, 15, 35, 0.85)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#f1f5f9' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/admin/clubs/create')}
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }
                  }}
                >
                  Add New Club
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ResetIcon />}
                  onClick={() => navigate('/admin/password-resets')}
                  sx={{ borderColor: 'rgba(139, 92, 246, 0.5)', color: '#a855f7' }}
                >
                  Password Reset Requests
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClubIcon />}
                  onClick={() => navigate('/admin/clubs')}
                  sx={{ borderColor: 'rgba(139, 92, 246, 0.5)', color: '#a855f7' }}
                >
                  Manage Clubs
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
