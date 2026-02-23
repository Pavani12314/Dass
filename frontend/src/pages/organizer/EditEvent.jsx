import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEvent({ ...event, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let payload = event;
      if (event.status === 'published') {
        payload = {
          description: event.description,
          registrationLimit: Number(event.registrationLimit),
          status: event.status
        };
        if (
          event.registrationDeadline &&
          !isNaN(Date.parse(event.registrationDeadline))
        ) {
          payload.registrationDeadline = event.registrationDeadline;
        }
      }
      await api.put(`/events/${id}`, payload);
      toast.success('Event updated successfully');
      navigate('/organizer/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return <Typography color="error">Event not found</Typography>;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Edit Event
      </Typography>
      <TextField
        label="Title"
        name="title"
        value={event.title || ''}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Description"
        name="description"
        value={event.description || ''}
        onChange={handleChange}
        fullWidth
        multiline
        minRows={3}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Venue"
        name="venue"
        value={event.venue || ''}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Start Date"
        name="startDate"
        type="datetime-local"
        value={event.startDate ? event.startDate.substring(0, 16) : ''}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="End Date"
        name="endDate"
        type="datetime-local"
        value={event.endDate ? event.endDate.substring(0, 16) : ''}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Capacity"
        name="registrationLimit"
        type="number"
        value={event.registrationLimit || 0}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Container>
  );
};

export default EditEvent;
