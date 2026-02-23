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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon, PersonAdd as FollowIcon, PersonRemove as UnfollowIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'technical', label: 'Technical' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'literary', label: 'Literary' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'fest-team', label: 'Fest Team' },
  { value: 'council', label: 'Council' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' }
];

const ClubsPage = () => {
  const { user, updateUser } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [followedIds, setFollowedIds] = useState([]);

  useEffect(() => {
    fetchOrganizers();
    if (user?.followedOrganizers) {
      setFollowedIds(user.followedOrganizers.map(o => o._id || o));
    }
  }, [user]);

  const fetchOrganizers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      
      const response = await api.get('/organizers', { params });
      setOrganizers(response.data);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrganizers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, category]);

  const handleFollow = async (orgId) => {
    try {
      await api.post(`/users/follow/${orgId}`);
      setFollowedIds([...followedIds, orgId]);
      toast.success('Club followed!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow');
    }
  };

  const handleUnfollow = async (orgId) => {
    try {
      await api.delete(`/users/follow/${orgId}`);
      setFollowedIds(followedIds.filter(id => id !== orgId));
      toast.success('Club unfollowed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unfollow');
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      technical: '#667eea',
      cultural: '#f472b6',
      sports: '#22c55e',
      literary: '#f59e0b',
      gaming: '#8b5cf6',
      'fest-team': '#ef4444',
      council: '#06b6d4',
      other: '#64748b'
    };
    return colors[cat] || colors.other;
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
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Clubs & Organizers
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Follow your favorite clubs to stay updated on their events
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Organizers Grid */}
      {organizers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            No clubs found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {organizers.map((org) => (
            <Grid item xs={12} sm={6} md={4} key={org._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderTop: `4px solid ${getCategoryColor(org.category)}`,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <CardActionArea 
                  component={Link} 
                  to={`/clubs/${org._id}`}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {org.name}
                        </Typography>
                        <Chip 
                          label={org.category} 
                          size="small" 
                          sx={{ 
                            textTransform: 'capitalize',
                            backgroundColor: getCategoryColor(org.category),
                            color: 'white'
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mt: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {org.description}
                    </Typography>

                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {org.followersCount || 0} followers
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
                
                <Box sx={{ px: 2, pb: 2 }}>
                  {followedIds.includes(org._id) ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<UnfollowIcon />}
                      onClick={(e) => {
                        e.preventDefault();
                        handleUnfollow(org._id);
                      }}
                    >
                      Unfollow
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<FollowIcon />}
                      onClick={(e) => {
                        e.preventDefault();
                        handleFollow(org._id);
                      }}
                    >
                      Follow
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ClubsPage;
