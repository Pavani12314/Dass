import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Rating,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Star as StarIcon
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const labels = {
  0.5: 'Terrible',
  1: 'Very Poor',
  1.5: 'Poor',
  2: 'Below Average',
  2.5: 'Average',
  3: 'Good',
  3.5: 'Very Good',
  4: 'Great',
  4.5: 'Excellent',
  5: 'Outstanding'
};

const Feedback = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [submitting, setSubmitting] = useState(false);
  const [hover, setHover] = useState(-1);
  const [feedback, setFeedback] = useState({
    rating: 4,
    comment: '',
    isAnonymous: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (feedback.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/feedback/${eventId}`, feedback);
      toast.success('Feedback submitted successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ textAlign: 'center' }}>
            Event Feedback
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
            Your feedback helps us improve future events
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                How would you rate this event?
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Rating
                  name="rating"
                  value={feedback.rating}
                  precision={0.5}
                  size="large"
                  onChange={(_, newValue) => setFeedback({ ...feedback, rating: newValue })}
                  onChangeActive={(_, newHover) => setHover(newHover)}
                  emptyIcon={<StarIcon style={{ opacity: 0.3 }} fontSize="inherit" />}
                  sx={{ fontSize: '3rem' }}
                />
                <Typography color="text.secondary">
                  {labels[hover !== -1 ? hover : feedback.rating]}
                </Typography>
              </Box>
            </Box>

            {/* Comment */}
            <TextField
              fullWidth
              label="Your Comments"
              placeholder="Share your experience, suggestions, or any issues you faced..."
              value={feedback.comment}
              onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              multiline
              rows={5}
              sx={{ mb: 3 }}
            />

            {/* Anonymous Toggle */}
            <Box 
              sx={{ 
                bgcolor: 'grey.50', 
                p: 2, 
                borderRadius: 2, 
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography fontWeight={500}>Submit Anonymously</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your name will be hidden from the organizers
                </Typography>
              </Box>
              <Switch
                checked={feedback.isAnonymous}
                onChange={(e) => setFeedback({ ...feedback, isAnonymous: e.target.checked })}
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Feedback;
