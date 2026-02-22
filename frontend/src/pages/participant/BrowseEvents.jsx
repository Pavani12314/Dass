import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  Pagination,
  CircularProgress,
  Paper,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../../services/api';
import EventCard from '../../components/EventCard';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    eligibility: '',
    startDate: '',
    endDate: '',
    followed: false
  });
  const [view, setView] = useState('all');

  useEffect(() => {
    fetchTrendingEvents();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [page, filters, view]);

  const fetchTrendingEvents = async () => {
    try {
      const response = await api.get('/events/trending');
      setTrendingEvents(response.data);
    } catch (error) {
      console.error('Error fetching trending events:', error);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        ...filters
      };
      
      if (view === 'followed') {
        params.followed = true;
      }

      const response = await api.get('/events', { params });
      setEvents(response.data.events);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleFilterChange('search', value);
    }, 300);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Browse Events
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Discover and register for exciting events
      </Typography>

      {/* Trending Section */}
      {trendingEvents.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Trending Now
            </Typography>
          </Box>
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
            {trendingEvents.map((event) => (
              <Box key={event._id} sx={{ minWidth: 280, flexShrink: 0 }}>
                <EventCard event={event} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search events..."
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={filters.eventType}
                label="Event Type"
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="merchandise">Merchandise</MenuItem>
                <MenuItem value="hackathon">Hackathon</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Eligibility</InputLabel>
              <Select
                value={filters.eligibility}
                label="Eligibility"
                onChange={(e) => handleFilterChange('eligibility', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="all">Open to All</MenuItem>
                <MenuItem value="iiit-only">IIIT Only</MenuItem>
                <MenuItem value="non-iiit-only">External Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
              fullWidth
              size="small"
            >
              <ToggleButton value="all">All Events</ToggleButton>
              <ToggleButton value="followed">Followed Clubs</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            type="date"
            label="From"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
          <TextField
            type="date"
            label="To"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
          {(filters.eventType || filters.eligibility || filters.startDate || filters.endDate) && (
            <Chip
              label="Clear Filters"
              onClick={() => setFilters({
                search: filters.search,
                eventType: '',
                eligibility: '',
                startDate: '',
                endDate: '',
                followed: false
              })}
              onDelete={() => setFilters({
                search: filters.search,
                eventType: '',
                eligibility: '',
                startDate: '',
                endDate: '',
                followed: false
              })}
            />
          )}
        </Box>
      </Paper>

      {/* Events Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No events found
          </Typography>
          <Typography color="text.secondary">
            Try adjusting your filters
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <EventCard event={event} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default BrowseEvents;
