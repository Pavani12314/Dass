import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Checkbox,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const INTERESTS = [
  'Technology', 'Coding', 'Gaming', 'Music', 'Dance', 'Art',
  'Photography', 'Robotics', 'AI/ML', 'Web Development', 'Cybersecurity',
  'Literature', 'Debate', 'Quizzing', 'Sports', 'Fitness',
  'Entrepreneurship', 'Finance', 'Design', 'Video Editing'
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrganizers, setLoadingOrganizers] = useState(true);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await api.get('/organizers');
      setOrganizers(response.data);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoadingOrganizers(false);
    }
  };

  const handleInterestToggle = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleOrganizerToggle = (organizerId) => {
    setSelectedOrganizers(prev =>
      prev.includes(organizerId)
        ? prev.filter(id => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.post('/users/onboarding', {
        interests: selectedInterests,
        followedOrganizers: selectedOrganizers,
        skip: false
      });
      updateUser({ onboardingCompleted: true });
      toast.success('Preferences saved!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await api.post('/users/onboarding', { skip: true });
      updateUser({ onboardingCompleted: true });
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to skip onboarding');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Areas of Interest', 'Follow Clubs'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center">
            Welcome to Felicity! 🎉
          </Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Let's personalize your experience
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                What are you interested in?
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Select topics that interest you to get personalized event recommendations
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {INTERESTS.map((interest) => (
                  <Chip
                    key={interest}
                    label={interest}
                    onClick={() => handleInterestToggle(interest)}
                    color={selectedInterests.includes(interest) ? 'primary' : 'default'}
                    variant={selectedInterests.includes(interest) ? 'filled' : 'outlined'}
                    icon={selectedInterests.includes(interest) ? <CheckIcon /> : undefined}
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Follow Clubs & Organizers
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Stay updated with events from your favorite clubs
              </Typography>

              {loadingOrganizers ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {organizers.map((org) => (
                    <Grid item xs={12} sm={6} md={4} key={org._id}>
                      <Card 
                        variant={selectedOrganizers.includes(org._id) ? 'elevation' : 'outlined'}
                        sx={{
                          border: selectedOrganizers.includes(org._id) 
                            ? '2px solid' 
                            : '1px solid',
                          borderColor: selectedOrganizers.includes(org._id) 
                            ? 'primary.main' 
                            : 'divider'
                        }}
                      >
                        <CardActionArea onClick={() => handleOrganizerToggle(org._id)}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Checkbox
                                checked={selectedOrganizers.includes(org._id)}
                                color="primary"
                              />
                              <Box>
                                <Typography fontWeight={600}>
                                  {org.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {org.category}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for now
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep > 0 && (
                <Button onClick={handleBack} disabled={loading}>
                  Back
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  onClick={handleComplete}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding;
