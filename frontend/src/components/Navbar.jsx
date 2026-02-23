import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  QrCodeScanner as ScannerIcon,
  AdminPanelSettings as AdminIcon,
  LockReset as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getNavItems = () => {
    if (user?.role === 'participant') {
      return [
        { label: 'Dashboard', path: '/participant/dashboard', icon: <DashboardIcon /> },
        { label: 'Browse Events', path: '/participant/events', icon: <EventIcon /> },
        { label: 'Clubs', path: '/participant/clubs', icon: <GroupsIcon /> },
        { label: 'Teams', path: '/participant/teams', icon: <GroupsIcon /> },
        { label: 'Profile', path: '/participant/profile', icon: <PersonIcon /> }
      ];
    } else if (user?.role === 'organizer') {
      return [
        { label: 'Dashboard', path: '/organizer/dashboard', icon: <DashboardIcon /> },
        { label: 'My Events', path: '/organizer/events', icon: <EventIcon /> },
        { label: 'Ongoing Events', path: '/organizer/events?status=ongoing', icon: <EventIcon /> },
        { label: 'Create Event', path: '/organizer/events/create', icon: <AddIcon /> },
        { label: 'Profile', path: '/organizer/profile', icon: <PersonIcon /> }
      ];
    } else if (user?.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
        { label: 'Manage Clubs', path: '/admin/clubs', icon: <GroupsIcon /> },
        { label: 'Password Resets', path: '/admin/password-resets', icon: <LockIcon /> }
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const drawer = (
    <Box sx={{ width: 280, pt: 2, height: '100%', background: 'linear-gradient(180deg, rgba(10,10,26,0.98) 0%, rgba(15,15,35,0.95) 100%)' }}>
      <Box sx={{ px: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>F</Typography>
        </Box>
        <Typography variant="h5" sx={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700
        }}>
          Felicity
        </Typography>
      </Box>
      <Divider sx={{ mx: 2, borderColor: 'rgba(139, 92, 246, 0.2)' }} />
      <List sx={{ px: 1, py: 2 }}>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={handleDrawerToggle}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              mx: 1,
              color: '#e2e8f0',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(139, 92, 246, 0.15)',
                transform: 'translateX(4px)',
              },
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
                '& .MuiListItemIcon-root': { color: 'white' }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#a78bfa' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItem>
        ))}
        <Divider sx={{ my: 2, mx: 2, borderColor: 'rgba(139, 92, 246, 0.2)' }} />
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            mx: 1,
            color: '#f87171',
            '&:hover': { background: 'rgba(239, 68, 68, 0.15)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#f87171' }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'rgba(10, 10, 26, 0.85)', 
          backdropFilter: 'blur(20px)',
          color: '#f1f5f9',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: '#a78bfa' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mr: 4,
              textDecoration: 'none',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>F</Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Felicity
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    color: location.pathname === item.path ? 'white' : '#a78bfa',
                    background: location.pathname === item.path 
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)'
                      : 'transparent',
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    boxShadow: location.pathname === item.path 
                      ? '0 4px 15px rgba(139, 92, 246, 0.4)'
                      : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: location.pathname === item.path 
                        ? 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a21caf 100%)'
                        : 'rgba(139, 92, 246, 0.15)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <IconButton onClick={handleProfileMenuOpen}>
            <Avatar sx={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              width: 36, 
              height: 36 
            }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                background: 'rgba(15, 15, 35, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography fontWeight={600} sx={{ color: '#f1f5f9' }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {user?.email}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(139, 92, 246, 0.2)' }} />
            <MenuItem onClick={handleLogout} sx={{ color: '#f87171' }}>
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#f87171' }} /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 }
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
