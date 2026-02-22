import { Card, CardContent, CardMedia, CardActionArea, Chip, Box, Typography, Stack } from '@mui/material';
import { Event as EventIcon, Person as PersonIcon, AccessTime as TimeIcon, LocalFireDepartment as HotIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const EventCard = ({ event, linkPrefix = '/events' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'published': return 'primary';
      case 'ongoing': return 'success';
      case 'completed': return 'info';
      case 'closed': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeGradient = (type) => {
    switch (type) {
      case 'normal': return 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)';
      case 'merchandise': return 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)';
      case 'hackathon': return 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)';
      default: return 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)';
    }
  };

  const isRegistrationOpen = () => {
    const deadline = new Date(event.registrationDeadline);
    const now = new Date();
    return now < deadline && ['published', 'ongoing'].includes(event.status);
  };

  const isHot = event.registrationCount > 50;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'rgba(15, 15, 35, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #8b5cf6, #ec4899, #06b6d4, transparent)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          '&::before': {
            opacity: 1,
          },
        },
      }}
    >
      <CardActionArea component={Link} to={`${linkPrefix}/${event._id}`}>
        <CardMedia
          component="div"
          sx={{
            height: 180,
            background: event.bannerImage 
              ? `url(${event.bannerImage})` 
              : 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 30%, #a855f7 60%, #c026d3 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              background: 'linear-gradient(to top, rgba(15,15,35,0.95), transparent)',
            },
          }}
        >
          {/* Animated glow overlay */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.2) 0%, transparent 60%)',
            animation: 'pulseGlow 3s ease-in-out infinite',
            '@keyframes pulseGlow': {
              '0%, 100%': { opacity: 0.5 },
              '50%': { opacity: 1 },
            },
          }} />

          <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1, zIndex: 1 }}>
            <Chip 
              label={event.eventType} 
              size="small" 
              sx={{ 
                textTransform: 'capitalize',
                background: getTypeGradient(event.eventType),
                color: 'white',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            />
            {isHot && (
              <Chip 
                icon={<HotIcon sx={{ color: '#ff6b6b !important' }} />}
                label="Hot" 
                size="small" 
                sx={{ 
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)',
                  color: 'white',
                  fontWeight: 600,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                  },
                }}
              />
            )}
          </Box>
          
          {event.status && (
            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
              <Chip 
                label={event.status} 
                size="small" 
                color={getStatusColor(event.status)}
                sx={{ 
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                }}
              />
            </Box>
          )}

          {!isRegistrationOpen() && (
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                background: 'linear-gradient(90deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))',
                color: 'white',
                py: 0.75,
                textAlign: 'center',
                zIndex: 2,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Typography variant="caption" fontWeight={600}>🚫 Registration Closed</Typography>
            </Box>
          )}
        </CardMedia>
        
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Typography 
            variant="h6" 
            component="h2" 
            gutterBottom 
            noWrap
            sx={{ 
              color: '#f1f5f9',
              fontWeight: 700,
              fontSize: '1.1rem',
            }}
          >
            {event.name}
          </Typography>
          
          {event.organizer && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <PersonIcon fontSize="small" sx={{ color: '#a855f7' }} />
              <Typography variant="body2" sx={{ color: '#a5b4fc' }}>
                {event.organizer.name || event.organizer}
              </Typography>
            </Stack>
          )}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <EventIcon fontSize="small" sx={{ color: '#ec4899' }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <TimeIcon fontSize="small" sx={{ color: '#06b6d4' }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Deadline: {format(new Date(event.registrationDeadline), 'MMM d')}
            </Typography>
          </Stack>

          {event.registrationFee > 0 ? (
            <Box 
              sx={{ 
                mt: 2,
                display: 'inline-block',
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                borderRadius: '20px',
                px: 2,
                py: 0.5,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                ₹{event.registrationFee}
              </Typography>
            </Box>
          ) : (
            <Box 
              sx={{ 
                mt: 2,
                display: 'inline-block',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                borderRadius: '20px',
                px: 2,
                py: 0.5,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                FREE
              </Typography>
            </Box>
          )}

          {event.tags && event.tags.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {event.tags.slice(0, 3).map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag} 
                  size="small" 
                  sx={{ 
                    fontSize: '0.7rem',
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default EventCard;
