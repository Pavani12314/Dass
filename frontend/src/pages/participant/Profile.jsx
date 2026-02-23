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
  Chip,
  Autocomplete,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  PersonAdd as FollowIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const interestOptions = [
  'Music', 'Dance', 'Drama', 'Art', 'Photography',
  'Technology', 'Coding', 'Robotics', 'Gaming', 'Sports',
  'Literature', 'Debate', 'Quiz', 'Entrepreneurship', 'Finance',
  'Social Work', 'Environment', 'Health', 'Fashion', 'Food'
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [followedClubs, setFollowedClubs] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    collegeName: '',
    participantType: '',
    interests: []
  });
  const [allClubs, setAllClubs] = useState([]);
  const [clubSearch, setClubSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchFollowedClubs();
    fetchAllClubs();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
        contactNumber: response.data.contactNumber || '',
        collegeName: response.data.collegeName || '',
        participantType: response.data.participantType || '',
        interests: response.data.interests || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedClubs = async () => {
    try {
      const response = await api.get('/users/following');
      setFollowedClubs(response.data);
    } catch (error) {
      console.error('Error fetching followed clubs:', error);
    }
  };

  const fetchAllClubs = async () => {
    try {
      const response = await api.get('/organizers');
      setAllClubs(response.data);
    } catch (error) {
      console.error('Error fetching all clubs:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        contactNumber: profile.contactNumber,
        collegeName: profile.collegeName,
        interests: profile.interests
      });
      updateUser({ ...user, firstName: profile.firstName, lastName: profile.lastName });
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUnfollow = async (clubId) => {
    try {
      await api.delete(`/users/follow/${clubId}`);
      setFollowedClubs(prev => prev.filter(club => club._id !== clubId));
      toast.success('Club unfollowed');
    } catch (error) {
      toast.error('Failed to unfollow club');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setChangingPassword(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleFollow = async (clubId) => {
    setFollowing(true);
    try {
      await api.post(`/users/follow/${clubId}`);
      toast.success('Club followed');
      fetchFollowedClubs();
      setSelectedClub(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow club');
    } finally {
      setFollowing(false);
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
        My Profile
      </Typography>

      <Grid container spacing={4}>
        {/* Profile Info */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Personal Information
                </Typography>
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

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Participant Type"
                    value={profile.participantType === 'iiit' ? 'IIIT Student' : 'Non-IIIT Participant'}
                    disabled
                    helperText="Participant type cannot be changed"
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="College/Organization Name"
                    value={profile.collegeName}
                    onChange={(e) => setProfile({ ...profile, collegeName: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={interestOptions}
                    value={profile.interests}
                    onChange={(_, newValue) => setProfile({ ...profile, interests: newValue })}
                    disabled={!editing}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          color="primary"
                          size="small"
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Interests"
                        placeholder={editing ? "Add interests..." : ""}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Followed Clubs */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Followed Clubs
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You follow {followedClubs.length} club{followedClubs.length !== 1 ? 's' : ''}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {/* Club follow autocomplete */}
              <Autocomplete
                options={allClubs.filter(club => !followedClubs.some(f => f._id === club._id))}
                getOptionLabel={option => option.name}
                value={selectedClub}
                onChange={(_, newValue) => setSelectedClub(newValue)}
                inputValue={clubSearch}
                onInputChange={(_, newInputValue) => setClubSearch(newInputValue)}
                renderInput={params => (
                  <TextField {...params} label="Follow a club" placeholder="Search clubs..." size="small" sx={{ mb: 2 }} />
                )}
                sx={{ mb: 2 }}
              />
              {selectedClub && (
                <Button
                  variant="contained"
                  startIcon={<FollowIcon />}
                  onClick={() => handleFollow(selectedClub._id)}
                  disabled={following}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {following ? 'Following...' : `Follow ${selectedClub.name}`}
                </Button>
              )}
              {/* ...existing followed clubs list... */}
              {followedClubs.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  You haven't followed any clubs yet
                </Typography>
              ) : (
                <List disablePadding>
                  {followedClubs.map((club) => (
                    <ListItem key={club._id} disableGutters>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        >
                          {club.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={club.name}
                        secondary={club.category}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleUnfollow(club._id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Account Stats
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Member since</Typography>
                  <Typography fontWeight={500}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Role</Typography>
                  <Chip 
                    label={user?.role || 'Participant'} 
                    size="small" 
                    color="primary"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LockIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Change Password
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  size="small"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  size="small"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  size="small"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
                <Button
                  variant="contained"
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                  fullWidth
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
