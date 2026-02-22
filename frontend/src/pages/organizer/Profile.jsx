import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  LockReset as ResetIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const OrganizerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    description: '',
    category: '',
    contactEmail: '',
    contactNumber: '',
    discordWebhook: ''
  });

  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    followers: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/organizers/profile');
      setProfile({
        name: response.data.name || '',
        email: user?.email || '',
        description: response.data.description || '',
        category: response.data.category || '',
        contactEmail: response.data.contactEmail || '',
        contactNumber: response.data.contactNumber || '',
        discordWebhook: response.data.discordWebhook || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/organizers/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/organizers/profile', profile);
      updateUser({ ...user, name: profile.name });
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setRequestingReset(true);
    try {
      await api.post('/organizers/request-password-reset');
      toast.success('Password reset request sent to admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request password reset');
    } finally {
      setRequestingReset(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Club Profile
      </Typography>

      <Grid container spacing={4}>
        {/* Profile Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      fontSize: '2rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    {profile.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {profile.name}
                    </Typography>
                    <Chip label={profile.category} size="small" sx={{ textTransform: 'capitalize', mt: 0.5 }} />
                  </Box>
                </Box>
                {!editing ? (
                  <Button startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <Button 
                    startIcon={<SaveIcon />} 
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Club Name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profile.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    disabled={!editing}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    value={profile.contactEmail}
                    onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    value={profile.contactNumber}
                    onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Discord Webhook URL"
                    value={profile.discordWebhook}
                    onChange={(e) => setProfile({ ...profile, discordWebhook: e.target.value })}
                    disabled={!editing}
                    placeholder="https://discord.com/api/webhooks/..."
                    helperText="New events will be automatically posted to this Discord channel"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats & Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Club Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography color="text.secondary">Total Events</Typography>
                  <Typography fontWeight={700}>{stats.totalEvents}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography color="text.secondary">Total Registrations</Typography>
                  <Typography fontWeight={700}>{stats.totalRegistrations}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography color="text.secondary">Followers</Typography>
                  <Typography fontWeight={700}>{stats.followers}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Security
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                Request a password reset from the admin if you need to change your password.
              </Typography>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<ResetIcon />}
                onClick={handleRequestPasswordReset}
                disabled={requestingReset}
                fullWidth
              >
                {requestingReset ? 'Requesting...' : 'Request Password Reset'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrganizerProfile;
