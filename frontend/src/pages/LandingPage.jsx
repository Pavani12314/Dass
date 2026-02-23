import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack, Chip } from '@mui/material';
import { 
  Rocket as RocketIcon, 
  Groups as GroupsIcon, 
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
  ArrowForward as ArrowIcon,
  AutoAwesome as SparkleIcon,
  Code as CodeIcon,
  MusicNote as MusicIcon,
  SportsEsports as GamingIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const words = ['Experience', 'Celebrate', 'Connect', 'Innovate', 'Create'];
  
  useEffect(() => {
    if (user) {
      // Redirect logged in users to their dashboard
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'organizer') navigate('/organizer/dashboard');
      else navigate('/participant/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const word = words[currentWordIndex];
    let charIndex = 0;
    let isDeleting = false;
    
    const typeInterval = setInterval(() => {
      if (!isDeleting && charIndex <= word.length) {
        setTypedText(word.substring(0, charIndex));
        charIndex++;
      } else if (isDeleting && charIndex >= 0) {
        setTypedText(word.substring(0, charIndex));
        charIndex--;
      }
      
      if (charIndex === word.length + 1) {
        isDeleting = true;
        clearInterval(typeInterval);
        setTimeout(() => {
          const deleteInterval = setInterval(() => {
            if (charIndex >= 0) {
              setTypedText(word.substring(0, charIndex));
              charIndex--;
            } else {
              clearInterval(deleteInterval);
              setCurrentWordIndex((prev) => (prev + 1) % words.length);
            }
          }, 50);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [currentWordIndex]);

  const features = [
    {
      icon: <RocketIcon sx={{ fontSize: 40 }} />,
      title: 'Launch Events',
      description: 'Create and manage events with our powerful event builder',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      title: 'Build Teams',
      description: 'Form teams, collaborate, and compete together',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    },
    {
      icon: <TrophyIcon sx={{ fontSize: 40 }} />,
      title: 'Win Prizes',
      description: 'Compete in hackathons and win exciting rewards',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    },
    {
      icon: <CelebrationIcon sx={{ fontSize: 40 }} />,
      title: 'Celebrate',
      description: 'Join cultural fests and make memories',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    },
  ];

  const clubs = [
    { name: 'Technical', icon: <CodeIcon />, color: '#8b5cf6' },
    { name: 'Cultural', icon: <MusicIcon />, color: '#ec4899' },
    { name: 'Gaming', icon: <GamingIcon />, color: '#06b6d4' },
    { name: 'Research', icon: <ScienceIcon />, color: '#10b981' },
  ];

  const stats = [
    { number: '50+', label: 'Events' },
    { number: '5000+', label: 'Participants' },
    { number: '20+', label: 'Clubs' },
    { number: '100+', label: 'Prizes' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative' }}>
              {/* Floating sparkles */}
              <SparkleIcon sx={{ 
                position: 'absolute', 
                top: -20, 
                left: -10, 
                color: '#fbbf24',
                fontSize: 30,
                animation: 'sparkle 2s ease-in-out infinite',
                '@keyframes sparkle': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1) rotate(0deg)' },
                  '50%': { opacity: 0.5, transform: 'scale(1.2) rotate(180deg)' },
                },
              }} />
              <SparkleIcon sx={{ 
                position: 'absolute', 
                top: 40, 
                right: 100, 
                color: '#ec4899',
                fontSize: 24,
                animation: 'sparkle 2.5s ease-in-out infinite 0.5s',
              }} />
              
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '4rem', lg: '4.5rem' },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  mb: 2,
                  color: '#f1f5f9',
                }}
              >
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #06b6d4 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Felicity
                </Box>
                <br />
                {typedText}
                <Box component="span" sx={{
                  display: 'inline-block',
                  width: 4,
                  height: '1em',
                  background: '#8b5cf6',
                  ml: 0.5,
                  animation: 'blink 1s infinite',
                  '@keyframes blink': {
                    '0%, 50%': { opacity: 1 },
                    '51%, 100%': { opacity: 0 },
                  },
                }} />
              </Typography>
              
              <Typography
                variant="h5"
                sx={{
                  color: '#94a3b8',
                  mb: 4,
                  fontWeight: 400,
                  maxWidth: 500,
                }}
              >
                IIIT Hyderabad's premier event management platform. 
                Discover events, join clubs, and be part of something amazing.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowIcon />}
                  onClick={() => navigate('/register')}
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    textTransform: 'none',
                    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      transition: 'left 0.5s',
                    },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 40px rgba(139, 92, 246, 0.5)',
                      '&::before': { left: '100%' },
                    },
                  }}
                >
                  Get Started
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    textTransform: 'none',
                    borderColor: 'rgba(139, 92, 246, 0.5)',
                    color: '#a5b4fc',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      borderColor: '#8b5cf6',
                      background: 'rgba(139, 92, 246, 0.1)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Stack>

              {/* Club categories */}
              <Box sx={{ mt: 4, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {clubs.map((club) => (
                  <Chip
                    key={club.name}
                    icon={club.icon}
                    label={club.name}
                    sx={{
                      background: `${club.color}20`,
                      border: `1px solid ${club.color}50`,
                      color: club.color,
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: club.color },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            {/* Animated illustration */}
            <Box sx={{ 
              position: 'relative',
              height: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Central glowing orb */}
              <Box sx={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(168,85,247,0.2) 50%, transparent 70%)',
                boxShadow: '0 0 60px rgba(139,92,246,0.4), 0 0 120px rgba(139,92,246,0.2)',
                animation: 'pulse 3s ease-in-out infinite',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.1)', opacity: 0.8 },
                },
              }}>
                <CelebrationIcon sx={{ fontSize: 80, color: '#a855f7' }} />
              </Box>

              {/* Orbiting icons */}
              {[RocketIcon, TrophyIcon, GroupsIcon, CodeIcon].map((Icon, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'rgba(15,15,35,0.8)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `orbit${i} ${8 + i * 2}s linear infinite`,
                    [`@keyframes orbit${i}`]: {
                      '0%': { transform: `rotate(${i * 90}deg) translateX(150px) rotate(-${i * 90}deg)` },
                      '100%': { transform: `rotate(${360 + i * 90}deg) translateX(150px) rotate(-${360 + i * 90}deg)` },
                    },
                  }}
                >
                  <Icon sx={{ color: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'][i] }} />
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Stats Section */}
        <Box sx={{ mt: 8 }}>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{
                  textAlign: 'center',
                  p: 3,
                  background: 'rgba(15, 15, 35, 0.6)',
                  borderRadius: '16px',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)',
                  },
                }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Features Section */}
        <Box sx={{ mt: 12 }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 6,
              color: '#f1f5f9',
            }}
          >
            Why{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Felicity
            </Box>
            ?
          </Typography>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'rgba(15, 15, 35, 0.7)',
                    borderRadius: '20px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.4s ease',
                    overflow: 'visible',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
                      '& .feature-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                      },
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      className="feature-icon"
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '16px',
                        background: feature.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        color: 'white',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            mt: 12,
            mb: 4,
            p: 6,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.2) 50%, rgba(6,182,212,0.2) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated background circles */}
          <Box sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite',
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite reverse',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-20px)' },
            },
          }} />

          <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9', mb: 2, position: 'relative' }}>
            Ready to join the excitement?
          </Typography>
          <Typography variant="body1" sx={{ color: '#a5b4fc', mb: 4, maxWidth: 500, mx: 'auto', position: 'relative' }}>
            Sign up today and never miss an event. Connect with clubs, join teams, and make the most of your campus life.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<RocketIcon />}
            onClick={() => navigate('/register')}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              px: 5,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 40px rgba(139, 92, 246, 0.5)',
              },
            }}
          >
            Join Felicity Now
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
