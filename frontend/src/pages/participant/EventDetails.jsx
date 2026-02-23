import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  Paper
} from '@mui/material';
import {
  Event as EventIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchEvent();
    checkRegistration();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const response = await api.get('/tickets/my-registrations');
      const allRegs = [
        ...response.data.upcoming,
        ...response.data.normal,
        ...response.data.merchandise,
        ...response.data.completed
      ];
      setIsRegistered(allRegs.some(r => r.event?._id === id));
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const canRegister = () => {
    if (!event) {
      console.log('Cannot register: event not loaded');
      return false;
    }
    if (isRegistered) {
      console.log('Cannot register: already registered');
      return false;
    }
    if (new Date() > new Date(event.registrationDeadline)) {
      console.log('Cannot register: registration deadline passed', event.registrationDeadline);
      return false;
    }
    if (event.registrationLimit && event.registrationCount >= event.registrationLimit) {
      console.log('Cannot register: registration limit reached', event.registrationLimit, event.registrationCount);
      return false;
    }
    if (!['published', 'ongoing'].includes(event.status)) {
      console.log('Cannot register: event status not published/ongoing', event.status);
      return false;
    }
    // Check eligibility
    if (event.eligibility === 'iiit-only' && user?.participantType !== 'iiit') {
      console.log('Cannot register: not IIIT eligible', user?.participantType);
      return false;
    }
    if (event.eligibility === 'non-iiit-only' && user?.participantType !== 'non-iiit') {
      console.log('Cannot register: not non-IIIT eligible', user?.participantType);
      return false;
    }
    return true;
  };

  const getBlockedReason = () => {
    if (isRegistered) return 'You are already registered';
    if (new Date() > new Date(event?.registrationDeadline)) return 'Registration deadline has passed';
    if (event?.registrationLimit && event?.registrationCount >= event?.registrationLimit) return 'Registration limit reached';
    if (event?.eligibility === 'iiit-only' && user?.participantType !== 'iiit') return 'This event is only for IIIT participants';
    if (event?.eligibility === 'non-iiit-only' && user?.participantType !== 'non-iiit') return 'This event is only for external participants';
    return null;
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      if (event.eventType === 'merchandise') {
        await api.post(`/tickets/purchase/${id}`, {
          variantId: selectedVariant,
          quantity
        });
        toast.success('Purchase successful! Check your email for the ticket.');
      } else if (event.eventType === 'hackathon') {
        // Navigate to team creation
        navigate(`/events/${id}/create-team`);
        return;
      } else {
        await api.post(`/tickets/register/${id}`, {
          formResponses
        });
        toast.success('Registration successful! Check your email for the ticket.');
      }
      setShowRegisterDialog(false);
      checkRegistration();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleAddToCalendar = () => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.name}
DESCRIPTION:${event.description.substring(0, 200)}
LOCATION:${event.venue || 'TBA'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!event) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Banner */}
          <Box
            sx={{
              height: 300,
              borderRadius: 3,
              background: event.bannerImage
                ? `url(${event.bannerImage})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              mb: 3,
              position: 'relative'
            }}
          >
            <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1 }}>
              <Chip 
                label={event.eventType} 
                color="primary"
                sx={{ textTransform: 'capitalize' }}
              />
              <Chip 
                label={event.status} 
                color={event.status === 'published' ? 'success' : 'default'}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
          </Box>

          <Typography variant="h3" fontWeight={700} gutterBottom>
            {event.name}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Chip
              icon={<PersonIcon />}
              label={event.organizer?.name}
              variant="outlined"
            />
            {event.tags?.map((tag, i) => (
              <Chip key={i} label={tag} size="small" variant="outlined" />
            ))}
          </Stack>

          <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-wrap' }}>
            {event.description}
          </Typography>

          {/* Custom Form Fields Preview */}
          {event.eventType === 'normal' && event.customFields?.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Registration Form Fields
              </Typography>
              {event.customFields.map((field, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography fontWeight={500}>
                    {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Type: {field.fieldType}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}

          {/* Merchandise Variants */}
          {event.eventType === 'merchandise' && event.merchandiseDetails && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Items
              </Typography>
              <Grid container spacing={2}>
                {event.merchandiseDetails.variants?.map((variant) => (
                  <Grid item xs={12} sm={6} key={variant._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography fontWeight={600}>
                          {variant.variantName || `${variant.size} - ${variant.color}`}
                        </Typography>
                        <Typography color="primary" fontWeight={600}>
                          ₹{variant.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock: {variant.stock > 0 ? variant.stock : 'Out of stock'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Hackathon Details */}
          {event.eventType === 'hackathon' && event.hackathonDetails && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Team Details
              </Typography>
              <Typography>
                Team Size: {event.hackathonDetails.minTeamSize} - {event.hackathonDetails.maxTeamSize} members
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography fontWeight={600}>
                      {format(new Date(event.startDate), 'MMM d, yyyy')}
                      {event.startDate !== event.endDate && 
                        ` - ${format(new Date(event.endDate), 'MMM d, yyyy')}`
                      }
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TimeIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Registration Deadline</Typography>
                    <Typography fontWeight={600}>
                      {format(new Date(event.registrationDeadline), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  </Box>
                </Box>

                {event.venue && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Venue</Typography>
                      <Typography fontWeight={600}>{event.venue}</Typography>
                    </Box>
                  </Box>
                )}

                {event.registrationFee > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MoneyIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Registration Fee</Typography>
                      <Typography fontWeight={600} color="primary">₹{event.registrationFee}</Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <GroupIcon color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Registrations</Typography>
                    <Typography fontWeight={600}>
                      {event.registrationCount}
                      {event.registrationLimit && ` / ${event.registrationLimit}`}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {getBlockedReason() && (
                  <Alert severity="warning" sx={{ py: 0.5 }}>
                    {getBlockedReason()}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!canRegister()}
                  onClick={() => setShowRegisterDialog(true)}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  {isRegistered ? 'Already Registered' : 
                    event.eventType === 'merchandise' ? 'Purchase Now' : 
                    event.eventType === 'hackathon' ? 'Create/Join Team' : 
                    'Register Now'}
                </Button>

                {isRegistered && (
                  <Button
                    variant="outlined"
                    onClick={handleAddToCalendar}
                    startIcon={<CalendarIcon />}
                  >
                    Add to Calendar
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Registration Dialog */}
      <Dialog 
        open={showRegisterDialog} 
        onClose={() => setShowRegisterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {event.eventType === 'merchandise' ? 'Purchase ' : 'Register for '}
          {event.name}
        </DialogTitle>
        <DialogContent>
          {event.eventType === 'merchandise' ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Select Variant</InputLabel>
                <Select
                  value={selectedVariant}
                  label="Select Variant"
                  onChange={(e) => setSelectedVariant(e.target.value)}
                >
                  {event.merchandiseDetails?.variants?.map((v) => (
                    <MenuItem 
                      key={v._id} 
                      value={v._id}
                      disabled={v.stock === 0}
                    >
                      {v.variantName || `${v.size} - ${v.color}`} - ₹{v.price} 
                      ({v.stock > 0 ? `${v.stock} left` : 'Out of stock'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: event.merchandiseDetails?.purchaseLimitPerParticipant || 5 }}
              />
            </Stack>
          ) : event.customFields?.length > 0 ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {event.customFields.map((field) => (
                <TextField
                  key={field.fieldName}
                  label={field.label}
                  required={field.required}
                  placeholder={field.placeholder}
                  multiline={field.fieldType === 'textarea'}
                  rows={field.fieldType === 'textarea' ? 3 : 1}
                  type={field.fieldType === 'number' ? 'number' : 
                        field.fieldType === 'email' ? 'email' : 
                        field.fieldType === 'date' ? 'date' : 'text'}
                  value={formResponses[field.fieldName] || ''}
                  onChange={(e) => setFormResponses({
                    ...formResponses,
                    [field.fieldName]: e.target.value
                  })}
                  InputLabelProps={field.fieldType === 'date' ? { shrink: true } : undefined}
                />
              ))}
            </Stack>
          ) : (
            <Typography sx={{ mt: 1 }}>
              Click confirm to complete your registration.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRegisterDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleRegister}
            disabled={registering || (event.eventType === 'merchandise' && !selectedVariant)}
          >
            {registering ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventDetails;
