const express = require('express');
const router = express.Router();
const {
  createTeam,
  joinTeam,
  completeTeamRegistration,
  getTeam,
  getMyTeams,
  leaveTeam,
  disbandTeam,
  sendTeamMessage,
  getTeamChat,
  inviteMember
} = require('../controllers/teamController');
const { protect, isParticipant } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Team management
router.get('/my-teams', getMyTeams); // <-- Add this route for user's teams
router.get('/', getMyTeams);
router.post('/join/:inviteCode', isParticipant, joinTeam);
router.post('/:eventId', isParticipant, createTeam);
router.post('/:teamId/complete', isParticipant, completeTeamRegistration);
router.delete('/:teamId/leave', isParticipant, leaveTeam);
router.delete('/:teamId', isParticipant, disbandTeam);
router.post('/:teamId/invite', inviteMember);

// Team chat
router.get('/:teamId/chat', getTeamChat);
router.post('/:teamId/chat', sendTeamMessage);
router.get('/:teamId', getTeam); // get team details (should be last)

module.exports = router;
