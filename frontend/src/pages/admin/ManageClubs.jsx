import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Avatar,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const clubCategories = [
  'Technical', 'Cultural', 'Sports', 'Literary', 'Social', 'Other'
];

const ManageClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    description: '',
    category: 'technical'
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await api.get('/admin/clubs');
      // Backend returns { success: true, data: [...] } or { organizers: [...] }
      const clubsData = response.data.data || response.data.organizers || response.data || [];
      // Map the data to match frontend field names
      const mappedClubs = clubsData.map(club => ({
        ...club,
        name: club.name || club.clubName,
        email: club.contactEmail || club.email
      }));
      setClubs(mappedClubs);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };



  const handleOpenDialog = (club = null) => {
    if (club) {
      setEditingClub(club);
      setFormData({
        name: club.name,
        email: club.email,
        password: '',
        description: club.description || '',
        category: club.category || 'technical'
      });
    } else {
      setEditingClub(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        description: '',
        category: 'technical'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClub(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      description: '',
      category: 'technical'
    });
  };


const handleSubmit = async () => {
  if (!formData.name || !formData.email) {
    toast.error('Please fill in all required fields');
    return;
  }

  if (!editingClub && !formData.password) {
    toast.error('Password is required for new clubs');
    return;
  }

  try {
    // Prepare data with correct field names for backend
    const submitData = {
      clubName: formData.name,  // Backend expects 'clubName'
      email: formData.email,
      password: formData.password,
      category: formData.category.toLowerCase(),
      description: formData.description || `${formData.name} club`
    };

    if (editingClub) {
      await api.put(`/admin/clubs/${editingClub._id}`, submitData);
      toast.success('Club updated successfully');
    } else {
      await api.post('/admin/clubs', submitData);
      toast.success('Club created successfully');
    }
    fetchClubs();
    handleCloseDialog();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to save club');
  }
};

// ... existing code ...

  const handleDelete = async (clubId) => {
    if (!window.confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/clubs/${clubId}`);
      setClubs(clubs.filter(c => c._id !== clubId));
      toast.success('Club deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete club');
    }
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Manage Clubs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Club
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            placeholder="Search clubs by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
            size="small"
          />
        </CardContent>
      </Card>

      {/* Clubs Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Club</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Events</TableCell>
                <TableCell>Followers</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {searchQuery ? 'No clubs found matching your search' : 'No clubs registered yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClubs.map((club) => (
                  <TableRow key={club._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                          {club.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={500}>{club.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {club.description?.substring(0, 50)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{club.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={club.category} 
                        size="small" 
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{club.eventsCount || 0}</TableCell>
                    <TableCell>{club.followersCount || 0}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(club)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(club._id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClub ? 'Edit Club' : 'Add New Club'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Club Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!editingClub}
            />
            <TextField
              fullWidth
              label={editingClub ? "New Password (leave blank to keep current)" : "Password"}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingClub}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <HideIcon /> : <ViewIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {clubCategories.map(cat => (
                  <MenuItem key={cat} value={cat.toLowerCase()}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingClub ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageClubs;
