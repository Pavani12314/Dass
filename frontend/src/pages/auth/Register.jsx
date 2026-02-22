import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Phone, School } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    participantType: 'iiit',
    collegeName: '',
    contactNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleTypeChange = (_, newType) => {
    if (newType) {
      setFormData({ ...formData, participantType: newType });
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.participantType === 'iiit') {
      const iiitDomains = ['iiit.ac.in', 'students.iiit.ac.in', 'research.iiit.ac.in'];
      const emailDomain = formData.email.split('@')[1];
      if (!iiitDomains.some(domain => emailDomain?.endsWith(domain))) {
        setError('IIIT participants must use an IIIT email address');
        return false;
      }
    }
    if (formData.participantType === 'non-iiit' && !formData.collegeName) {
      setError('Please enter your college/organization name');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        participantType: formData.participantType,
        collegeName: formData.collegeName,
        contactNumber: formData.contactNumber
      });
      toast.success('Registration successful!');
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        display: 'flex',
        alignItems: 'center',
        background: 'transparent'
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="h3" 
              fontWeight={700}
              sx={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Felicity
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: '#f1f5f9' }}>
            Create Account
          </Typography>
          <Typography sx={{ mb: 3, color: '#94a3b8' }}>
            Join us for amazing events!
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#a5b4fc' }}>
                I am a
              </Typography>
              <ToggleButtonGroup
                value={formData.participantType}
                exclusive
                onChange={handleTypeChange}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    color: '#a5b4fc',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                      color: 'white',
                    },
                    '&:hover': {
                      background: 'rgba(139, 92, 246, 0.15)',
                    }
                  }
                }}
              >
                <ToggleButton value="iiit" sx={{ py: 1.5 }}>
                  IIIT Student
                </ToggleButton>
                <ToggleButton value="non-iiit" sx={{ py: 1.5 }}>
                  External Participant
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mt: 2 }}
              helperText={
                formData.participantType === 'iiit' 
                  ? 'Use your IIIT email (e.g., name@iiit.ac.in)'
                  : ''
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                )
              }}
            />

            {formData.participantType === 'non-iiit' && (
              <TextField
                fullWidth
                label="College / Organization Name"
                name="collegeName"
                value={formData.collegeName}
                onChange={handleChange}
                required
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School color="action" />
                    </InputAdornment>
                  )
                }}
              />
            )}

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              sx={{ mt: 2, mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a21caf 100%)',
                  boxShadow: '0 8px 30px rgba(139, 92, 246, 0.5)',
                }
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography sx={{ color: '#94a3b8' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
