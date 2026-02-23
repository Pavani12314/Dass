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
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Email as EmailIcon,
  QrCode as QRIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedReg, setSelectedReg] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvent();
    // fetchRegistrations(); // <-- Commented out to prevent 404 error
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
      navigate('/organizer/events');
    } finally {
      setLoading(false);
    }
  };

  // Comment out fetchRegistrations function if not needed
  // const fetchRegistrations = async (status = '') => {
  //   try {
  //     const response = await api.get(`/events/${id}/registrations`, { params: { status } });
  //     setRegistrations(response.data);
  //   } catch (error) {
  //     console.error('Error fetching registrations:', error);
  //   }
  // };

  // Comment out handleTabChange if not needed
  // const handleTabChange = (_, value) => {
  //   setActiveTab(value);
  //   const statuses = ['', 'pending', 'approved', 'rejected'];
  //   fetchRegistrations(statuses[value]);
  // };

  const handleApprove = async (regId) => {
    try {
      await api.put(`/registrations/${regId}/status`, { status: 'approved' });
      toast.success('Registration approved');
      fetchRegistrations();
    } catch (error) {
      toast.error('Failed to approve registration');
    }
  };

  const handleReject = async (regId) => {
    try {
      await api.put(`/registrations/${regId}/status`, { status: 'rejected' });
      toast.success('Registration rejected');
      fetchRegistrations();
    } catch (error) {
      toast.error('Failed to reject registration');
    }
  };

  const handleSendReminder = async () => {
    try {
      await api.post(`/events/${id}/send-reminder`);
      toast.success('Reminder emails sent to all registered participants');
    } catch (error) {
      toast.error('Failed to send reminders');
    }
  };

  const handleExportRegistrations = async () => {
    try {
      const response = await api.get(`/events/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title}-registrations.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export registrations');
    }
  };

  const viewRegistrationDetails = (reg) => {
    setSelectedReg(reg);
    setDetailsDialogOpen(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!event) return null;

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/organizer/events')}>
          Back to Events
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Event Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h5" fontWeight={700}>
                  {event.title}
                </Typography>
                <IconButton onClick={() => navigate(`/organizer/events/${id}/edit`)}>
                  <EditIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip label={event.category} color="primary" sx={{ textTransform: 'capitalize' }} />
                {event.isPaid && <Chip label={`₹${event.price}`} color="success" />}
                {event.isTeamEvent && <Chip label="Team Event" color="info" />}
              </Box>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {event.description}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Venue</Typography>
                  <Typography fontWeight={500}>{event.venue}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Start</Typography>
                  <Typography fontWeight={500}>{formatDate(event.startDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">End</Typography>
                  <Typography fontWeight={500}>{formatDate(event.endDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Registration Deadline</Typography>
                  <Typography fontWeight={500}>{formatDate(event.registrationDeadline)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Capacity</Typography>
                  <Typography fontWeight={500}>
                    {stats.approved} / {event.capacity} registered
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<EmailIcon />}
                  onClick={handleSendReminder}
                  fullWidth
                >
                  Send Reminder Email
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<DownloadIcon />}
                  onClick={handleExportRegistrations}
                  fullWidth
                >
                  Export Registrations
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Registration Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="h4" fontWeight={700}>{stats.total}</Typography>
                    <Typography variant="caption" color="text.secondary">Total</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="h4" fontWeight={700}>{stats.pending}</Typography>
                    <Typography variant="caption">Pending</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h4" fontWeight={700}>{stats.approved}</Typography>
                    <Typography variant="caption">Approved</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="h4" fontWeight={700}>{stats.rejected}</Typography>
                    <Typography variant="caption">Rejected</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Registrations */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Registrations
              </Typography>

              {/* Commented out Tabs and registration table to prevent 404 error
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="All" />
                <Tab label="Pending" />
                <Tab label="Approved" />
                <Tab label="Rejected" />
              </Tabs>

              {registrations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No registrations found</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Participant</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Registered On</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registrations.map((reg) => (
                        <TableRow key={reg._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                {reg.user?.name?.charAt(0) || 'U'}
                              </Avatar>
                              {reg.user?.name || 'Unknown'}
                            </Box>
                          </TableCell>
                          <TableCell>{reg.user?.email}</TableCell>
                          <TableCell>
                            {new Date(reg.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={reg.status}
                              size="small"
                              color={
                                reg.status === 'approved' ? 'success' :
                                reg.status === 'pending' ? 'warning' : 'error'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => viewRegistrationDetails(reg)}
                              title="View Details"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            {reg.status === 'pending' && (
                              <>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApprove(reg._id)}
                                  title="Approve"
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReject(reg._id)}
                                  title="Reject"
                                >
                                  <RejectIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Registration Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registration Details</DialogTitle>
        <DialogContent>
          {selectedReg && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Participant</Typography>
                <Typography fontWeight={500}>{selectedReg.user?.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography>{selectedReg.user?.email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Phone</Typography>
                <Typography>{selectedReg.user?.phone || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>
                  <Chip
                    label={selectedReg.status}
                    size="small"
                    color={
                      selectedReg.status === 'approved' ? 'success' :
                      selectedReg.status === 'pending' ? 'warning' : 'error'
                    }
                  />
                </Box>
              </Box>
              {selectedReg.customFields && Object.keys(selectedReg.customFields).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Custom Fields</Typography>
                  {Object.entries(selectedReg.customFields).map(([key, value]) => (
                    <Box key={key}>
                      <Typography variant="caption" color="text.secondary">{key}</Typography>
                      <Typography>{value}</Typography>
                    </Box>
                  ))}
                </>
              )}
              {selectedReg.ticketId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Ticket ID</Typography>
                  <Typography fontFamily="monospace">{selectedReg.ticketId}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedReg?.status === 'pending' && (
            <>
              <Button 
                color="error" 
                onClick={() => { handleReject(selectedReg._id); setDetailsDialogOpen(false); }}
              >
                Reject
              </Button>
              <Button 
                variant="contained" 
                color="success"
                onClick={() => { handleApprove(selectedReg._id); setDetailsDialogOpen(false); }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventDetail;
