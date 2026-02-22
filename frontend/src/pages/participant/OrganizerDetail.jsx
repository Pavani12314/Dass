import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Chip
} from '@mui/material';
import { PersonAdd as FollowIcon, PersonRemove as UnfollowIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EventCard from '../../components/EventCard';
import toast from 'react-hot-toast';

const OrganizerDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchOrganizer();
    fetchEvents();
    checkFollowing();
  }, [id]);

  const fetchOrganizer = async () => {
    try {
      const response = await api.get(`/organizers/${id}`);
      setOrganizer(response.data);
    } catch (error) {
      console.error('Error fetching organizer:', error);
    }
  };

  const fetchEvents = async (type = 'upcoming') => {
    try {
      const response = await api.get(`/organizers/${id}/events`, { params: { type } });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowing = async () => {
    try {
      const response = await api.get('/users/following');
      setIsFollowing(response.data.some(org => org._id === id));
    } catch (error) {
      console.error('Error checking following:', error);
    }
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setLoading(true);
    fetchEvents(newValue === 0 ? 'upcoming' : 'past');
  };

  const handleFollow = async () => {
    try {
      await api.post(`/users/follow/${id}`);
      setIsFollowing(true);
      setOrganizer(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
      toast.success('Club followed!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow');
    }
  };

  const handleUnfollow = async () => {
    try {
      await api.delete(`/users/follow/${id}`);
      setIsFollowing(false);
      setOrganizer(prev => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 1) - 1) }));
      toast.success('Club unfollowed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unfollow');
    }
  };

  if (!organizer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { md: 'center' } }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: 2,
                background: organizer.logo 
                  ? `url(${organizer.logo})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 700
              }}
            >
              {!organizer.logo && organizer.name.charAt(0)}
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {organizer.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={organizer.category} color="primary" sx={{ textTransform: 'capitalize' }} />
                <Chip label={`${organizer.followersCount || 0} followers`} variant="outlined" />
              </Box>
              <Typography color="text.secondary">
                {organizer.description}
              </Typography>
            </Box>

            <Box>
              {isFollowing ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<UnfollowIcon />}
                  onClick={handleUnfollow}
                  size="large"
                >
                  Unfollow
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<FollowIcon />}
                  onClick={handleFollow}
                  size="large"
                >
                  Follow
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Events */}
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Events
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Upcoming" />
        <Tab label="Past" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No {activeTab === 0 ? 'upcoming' : 'past'} events
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <EventCard event={event} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default OrganizerDetail;
