import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  QrCodeScanner as ScanIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QRScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    fetchEvent();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setResult(null);

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    stopScanning();
    
    try {
      // Parse QR code data
      const data = JSON.parse(decodedText);
      
      // Verify ticket with backend
      const response = await api.post(`/tickets/scan`, {
        ticketId: data.ticketId,
        eventId
      });

      setResult({
        success: true,
        data: response.data
      });
      setDialogOpen(true);
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Invalid QR code'
      });
      setDialogOpen(true);
    }
  };

  const onScanFailure = (error) => {
    // Ignore scan failures (they happen continuously until a code is found)
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setResult(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        QR Scanner
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Scan participant tickets for {event?.title}
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {!scanning ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ScanIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ready to Scan
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Click the button below to start scanning tickets
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<ScanIcon />}
                onClick={startScanning}
              >
                Start Scanning
              </Button>
            </Box>
          ) : (
            <Box>
              <Box id="reader" sx={{ width: '100%' }} />
              <Button
                variant="outlined"
                fullWidth
                onClick={stopScanning}
                sx={{ mt: 2 }}
              >
                Stop Scanning
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Result Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {result?.success ? (
              <SuccessIcon color="success" />
            ) : (
              <ErrorIcon color="error" />
            )}
            {result?.success ? 'Attendance Marked!' : 'Scan Failed'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {result?.success ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                  {result.data.participant?.firstName?.charAt(0) || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {result.data.participant?.firstName} {result.data.participant?.lastName}
                  </Typography>
                  <Typography color="text.secondary">{result.data.participant?.email}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert severity="success" sx={{ mt: 2 }}>
                Checked in at {new Date(result.data.attendedAt).toLocaleString()}
              </Alert>
            </Box>
          ) : (
            <Alert severity="error">
              {result?.message || 'Unable to verify this ticket'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { handleCloseDialog(); startScanning(); }}>
            Scan Another
          </Button>
          <Button variant="outlined" onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QRScanner;
