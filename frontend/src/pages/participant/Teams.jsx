import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  MenuItem
} from '@mui/material';
import {
  Group as TeamIcon,
  Add as AddIcon,
  PersonAdd as InviteIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  ExitToApp as LeaveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Teams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teamSize, setTeamSize] = useState(2);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchTeams();
    fetchEvents();
  }, []);

  // Open Create Team dialog and set default event
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    if (events.length > 0) {
      setSelectedEventId(events[0]._id);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/api/teams/my-teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // Fetch all hackathon events regardless of status
      const response = await api.get('/api/events', { params: { eventType: 'hackathon' } });
      setEvents(response.data.events || response.data);
      console.log('Fetched hackathon events:', response.data.events || response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    if (!selectedEventId) {
      toast.error('Please select an event');
      return;
    }
    console.log('Selected eventId:', selectedEventId);
    try {
      const response = await api.post(`/api/teams/${selectedEventId}`, {
        teamName: newTeamName,
        maxSize: teamSize
      });
      setTeams(prev => [...prev, response.data.team]);
      setCreateDialogOpen(false);
      setNewTeamName('');
      setSelectedEventId('');
      setTeamSize(2);
      setSelectedTeam(response.data.team); // Set the newly created team as selected
      toast.success('Team created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email');
      return;
    }
    try {
      await api.post(`/api/teams/${selectedTeam._id}/invite`, { email: inviteEmail });
      toast.success('Invitation sent!');
      setInviteDialogOpen(false);
      setInviteEmail('');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      await api.delete(`/api/teams/${teamId}/leave`);
      setTeams(prev => prev.filter(t => t._id !== teamId));
      toast.success('Left team successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave team');
    }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    try {
      await api.delete(`/api/teams/${teamId}/members/${memberId}`);
      fetchTeams();
      toast.success('Member removed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const myTeams = teams.filter(t => t.leader?._id === user?.id || t.leader === user?.id);
  const joinedTeams = teams.filter(t => t.leader?._id !== user?.id && t.leader !== user?.id);

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
          My Teams
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Create Team
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label={`My Teams (${myTeams.length})`} />
        <Tab label={`Joined Teams (${joinedTeams.length})`} />
      </Tabs>

      {teams.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <TeamIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Teams Yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create a team to participate in hackathons and team events
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {(activeTab === 0 ? myTeams : joinedTeams).map((team) => (
            <Grid item xs={12} md={6} key={team._id}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {team.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={`${team.members?.length || 1} members`}
                          size="small"
                          icon={<TeamIcon />}
                        />
                        {team.event && (
                          <Chip label={team.event.name} size="small" color="primary" />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/participant/teams/${team._id}/chat`)}
                        title="Team Chat"
                      >
                        <ChatIcon />
                      </IconButton>
                      {/* Always show Invite button for leader if team is not full */}
                      {team.leader && (team.leader._id === user?.id || team.leader === user?.id) && (team.members?.length < team.maxSize) && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedTeam(team);
                            setInviteDialogOpen(true);
                          }}
                          color="primary"
                          title="Invite Member"
                        >
                          <InviteIcon />
                        </IconButton>
                      )}
                      {/* Show Leave button for non-leaders */}
                      {team.leader && !(team.leader._id === user?.id || team.leader === user?.id) && (
                        <IconButton
                          size="small"
                          onClick={() => handleLeaveTeam(team._id)}
                          color="error"
                          title="Leave Team"
                        >
                          <LeaveIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Team Members
                  </Typography>
                  {/* Show member status in the list */}
                  <List dense disablePadding>
                    {team.members?.map((member) => (
                      <ListItem key={member.user?._id || member._id || member} disableGutters>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {(member.user?.firstName || member.user?.name || member.name || 'U').charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={member.user?.firstName ? `${member.user.firstName} ${member.user.lastName}` : member.user?.email || member.email || 'Unknown'}
                          secondary={
                            (team.leader?._id === (member.user?._id || member._id) || team.leader === (member.user?._id || member._id))
                              ? 'Leader'
                              : member.status === 'pending' ? 'Invited (Pending)' : member.status === 'accepted' ? 'Member' : 'Declined'
                          }
                        />
                        {/* Leader can remove any member except themselves */}
                        {(team.leader?._id === user?.id || team.leader === user?.id) &&
                          (member.user?._id || member._id) !== user?.id && (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMember(team._id, member.user?._id || member._id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                      </ListItem>
                    ))}
                  </List>

                  {/* Registration status and invite tracking UI for leader */}
                  {(activeTab === 0 && (team.leader?._id === user?.id || team.leader === user?.id)) && (
                    <Box sx={{ mt: 2 }}>
                      {/* Registration Status */}
                      <Typography variant="subtitle1" color={team.members?.length === team.maxSize && team.members?.every(m => m.status === 'accepted') ? 'success.main' : 'warning.main'}>
                        Registration Status: {team.members?.length === team.maxSize && team.members?.every(m => m.status === 'accepted') ? 'Complete' : 'Incomplete'}
                      </Typography>
                      {/* Invite Tracking */}
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>Invite Tracking:</Typography>
                      <List dense>
                        {team.members?.map((member) => (
                          <ListItem key={member.user?._id || member._id || member}>
                            <ListItemText
                              primary={member.user?.firstName ? `${member.user.firstName} ${member.user.lastName}` : member.user?.email || member.email || 'Unknown'}
                              secondary={member.status === 'pending' ? 'Invited (Pending)' : member.status === 'accepted' ? 'Accepted' : member.status === 'declined' ? 'Declined' : 'Unknown'}
                            />
                          </ListItem>
                        ))}
                      </List>
                      {/* Invite Code/Link */}
                      <Typography variant="subtitle1">Invite Code:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {team.inviteCode ? team.inviteCode : 'No invite code available'}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>Invite Link:</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {team.inviteLink ? team.inviteLink : 'No invite link available'}
                      </Typography>
                      <Button
                        variant="outlined"
                        sx={{ mt: 1 }}
                        disabled={!team.inviteLink}
                        onClick={() => team.inviteLink && navigator.clipboard.writeText(team.inviteLink)}
                      >Copy Invite Link</Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Enter a unique team name"
          />
          <TextField
            select
            fullWidth
            label="Select Hackathon Event"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            sx={{ mt: 2 }}
          >
            {events.length === 0 ? (
              <MenuItem disabled>No hackathon events found. Please create one as Organizer.</MenuItem>
            ) : (
              events.map(event => (
                <MenuItem key={event._id} value={event._id}>
                  {event.name}
                </MenuItem>
              ))
            )}
          </TextField>
          <TextField
            type="number"
            fullWidth
            label="Team Size"
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value))}
            sx={{ mt: 2 }}
            inputProps={{ min: 2, max: 10 }}
          />
          {/* After team creation, show invite code/link */}
          {createDialogOpen && selectedTeam && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Invite Code:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTeam.inviteCode}</Typography>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Invite Link:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{selectedTeam.inviteLink}</Typography>
              <Button
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={() => navigator.clipboard.writeText(selectedTeam.inviteLink)}
              >Copy Invite Link</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTeam}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Enter the email of the person you want to invite to {selectedTeam?.name}
          </Typography>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite}>Send Invite</Button>
        </DialogActions>
      </Dialog>

      {/* Join Team via Invite Code */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Join a Team with Invite Code</Typography>
        <TextField
          label="Invite Code"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          sx={{ mt: 2, mr: 2 }}
        />
        <Button
          variant="contained"
          onClick={async () => {
            try {
              await api.post(`/api/teams/join/${inviteCode}`);
              toast.success('Joined team successfully');
              fetchTeams();
            } catch (error) {
              toast.error(error.response?.data?.message || 'Failed to join team');
            }
          }}
        >Join Team</Button>
      </Box>
    </Container>
  );
};

export default Teams;
