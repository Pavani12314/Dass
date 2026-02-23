import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  ConfirmationNumber as TicketIcon
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TicketView = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [registrationId]);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${registrationId}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Create a downloadable image of the ticket
    if (ticket?.qrCode) {
      const link = document.createElement('a');
      link.href = ticket.qrCode;
      link.download = `ticket-${ticket.ticketId}.png`;
      link.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${ticket.event?.title}`,
          text: `My ticket for ${ticket.event?.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
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

  if (!ticket) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Ticket not found
        </Typography>
        <Button onClick={() => navigate('/participant/dashboard')}>
          Go to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <BackIcon />
        </IconButton>
      </Box>

      <Card 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          overflow: 'visible',
          position: 'relative'
        }}
      >
        {/* Ticket Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                Event Ticket
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {ticket.event?.title}
              </Typography>
            </Box>
            <Chip 
              label={ticket.status === 'approved' ? 'Valid' : ticket.status}
              sx={{ 
                bgcolor: ticket.status === 'approved' ? 'success.main' : 'warning.main',
                color: 'white',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            />
          </Box>
        </Box>

        {/* Dotted Line Separator */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            px: 2
          }}
        >
          <Box 
            sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: 'background.default',
              ml: -4
            }} 
          />
          <Box 
            sx={{ 
              flex: 1, 
              borderBottom: '2px dashed rgba(255,255,255,0.3)',
              mx: 1
            }} 
          />
          <Box 
            sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: 'background.default',
              mr: -4
            }} 
          />
        </Box>

        {/* Ticket Body */}
        <CardContent sx={{ p: 3, pt: 2 }}>
          {/* Event Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon sx={{ opacity: 0.8 }} />
              <Typography>{formatDate(ticket.event?.startDate)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon sx={{ opacity: 0.8 }} />
              <Typography>{formatTime(ticket.event?.startDate)} - {formatTime(ticket.event?.endDate)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon sx={{ opacity: 0.8 }} />
              <Typography>{ticket.event?.venue}</Typography>
            </Box>
          </Box>

          {/* QR Code */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              mb: 3
            }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                p: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {ticket.qrCode ? (
                <img 
                  src={ticket.qrCode} 
                  alt="Ticket QR Code"
                  style={{ width: 180, height: 180 }}
                />
              ) : (
                <Box sx={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TicketIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                </Box>
              )}
            </Box>
          </Box>

          {/* Ticket ID */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Ticket ID
            </Typography>
            <Typography variant="h6" fontFamily="monospace" fontWeight={600}>
              {ticket.ticketId}
            </Typography>
          </Box>

          {/* Participant Info */}
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Registered To
            </Typography>
            <Typography fontWeight={500}>
              {ticket.user?.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {ticket.user?.email}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleShare}
        >
          Share
        </Button>
      </Box>
    </Container>
  );
};

export default TicketView;
