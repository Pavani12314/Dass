const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'felicity.events@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate QR code
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (error) {
    console.error('QR generation error:', error);
    return null;
  }
};

// @desc    Create a team
// @route   POST /api/teams/:eventId
// @access  Private (Participants only)
const createTeam = async (req, res) => {
  try {
    const { teamName, maxSize } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.eventType !== 'hackathon') {
      return res.status(400).json({ message: 'Teams are only for hackathon events' });
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if user is already in a team for this event
    const existingTeam = await Team.findOne({
      event: event._id,
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({ message: 'You are already in a team for this event' });
    }

    
    // Validate team size
    const teamSize = maxSize || event.hackathonDetails.maxTeamSize;
    if (teamSize < event.hackathonDetails.minTeamSize || teamSize > event.hackathonDetails.maxTeamSize) {
      return res.status(400).json({ 
        message: `Team size must be between ${event.hackathonDetails.minTeamSize} and ${event.hackathonDetails.maxTeamSize}` 
      });
    }

    // Generate unique invite code
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();

    const team = await Team.create({
      name: teamName,
      event: event._id,
      leader: req.user._id,
      members: [{
        user: req.user._id,
        status: 'accepted',
        respondedAt: new Date()
      }],
      inviteCode,
      maxSize: teamSize,
      minSize: event.hackathonDetails.minTeamSize
    });

    res.status(201).json({
      message: 'Team created successfully',
      team: {
        _id: team._id,
        name: team.name,
        inviteCode: team.inviteCode,
        inviteLink: `${process.env.FRONTEND_URL}/join-team/${team.inviteCode}`,
        maxSize: team.maxSize,
        currentSize: 1
      }
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join team via invite code
// @route   POST /api/teams/join/:inviteCode
// @access  Private (Participants only)
const joinTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ inviteCode: req.params.inviteCode })
      .populate('event');

    if (!team) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check registration deadline
    if (new Date() > new Date(team.event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if team is full
    const acceptedMembers = team.members.filter(m => m.status === 'accepted').length;
    if (acceptedMembers >= team.maxSize) {
      return res.status(400).json({ message: 'Team is already full' });
    }

    // Check if user is already in this team
    const existingMember = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (existingMember) {
      if (existingMember.status === 'accepted') {
        return res.status(400).json({ message: 'You are already a member of this team' });
      } else if (existingMember.status === 'pending') {
        return res.status(400).json({ message: 'You have a pending invitation' });
      }
    }

    // Check if user is in another team for this event
    const otherTeam = await Team.findOne({
      event: team.event._id,
      _id: { $ne: team._id },
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id, 'members.status': 'accepted' }
      ]
    });

    if (otherTeam) {
      return res.status(400).json({ message: 'You are already in another team for this event' });
    }

    // Check eligibility
    const user = await User.findById(req.user._id);
    if (team.event.eligibility === 'iiit-only' && user.participantType !== 'iiit') {
      return res.status(403).json({ message: 'This event is only for IIIT participants' });
    }

    // Add member
    team.members.push({
      user: req.user._id,
      status: 'accepted',
      respondedAt: new Date()
    });

    // Check if team is now complete
    const newMemberCount = team.members.filter(m => m.status === 'accepted').length;
    if (newMemberCount >= team.minSize) {
      team.isComplete = true;
    }

    await team.save();

    // Notify team leader via socket (handled in frontend)
    const io = req.app.get('io');
    io.to(`team_${team._id}`).emit('memberJoined', {
      teamId: team._id,
      member: {
        _id: req.user._id,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

    res.json({
      message: 'Joined team successfully',
      team: {
        _id: team._id,
        name: team.name,
        event: team.event.name,
        currentSize: newMemberCount,
        maxSize: team.maxSize,
        isComplete: team.isComplete
      }
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Complete team registration
// @route   POST /api/teams/:teamId/complete
// @access  Private (Team leader only)
const completeTeamRegistration = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('event')
      .populate('leader', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can complete registration' });
    }

    const acceptedMembers = team.members.filter(m => m.status === 'accepted');
    
    if (acceptedMembers.length < team.minSize) {
      return res.status(400).json({ 
        message: `Team needs at least ${team.minSize} members to complete registration` 
      });
    }

    if (team.registrationComplete) {
      return res.status(400).json({ message: 'Registration already completed' });
    }

    // Generate tickets for all members
    const registrations = [];
    
    for (const member of acceptedMembers) {
      const ticketId = `FEL-TEAM-${uuidv4().substring(0, 8).toUpperCase()}`;
      const qrData = {
        ticketId,
        eventId: team.event._id,
        participantId: member.user._id,
        teamId: team._id,
        teamName: team.name
      };
      const qrCode = await generateQRCode(qrData);

      const registration = await Registration.create({
        event: team.event._id,
        participant: member.user._id,
        team: team._id,
        ticketId,
        qrCode,
        status: 'confirmed'
      });

      registrations.push(registration);

      // Send email to each member
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER || 'felicity.events@gmail.com',
          to: member.user.email,
          subject: `Team Registration Confirmed - ${team.event.name}`,
          html: `
            <h1> Team Registration Confirmed!</h1>
            <p>Hello ${member.user.firstName},</p>
            <p>Your team <strong>${team.name}</strong> has been registered for <strong>${team.event.name}</strong>.</p>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <img src="${qrCode}" alt="QR Code" style="max-width: 200px;"/>
          `
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    // Update team and event
    team.registrationComplete = true;
    team.isComplete = true;
    await team.save();

    const event = await Event.findById(team.event._id);
    event.registrationCount += acceptedMembers.length;
    if (!event.formLocked) {
      event.formLocked = true;
    }
    await event.save();

    res.json({
      message: 'Team registration completed successfully',
      registrations: registrations.map(r => ({
        ticketId: r.ticketId,
        participant: acceptedMembers.find(m => m.user._id.toString() === r.participant.toString())?.user
      }))
    });
  } catch (error) {
    console.error('Complete team registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper to add inviteCode and inviteLink to team object
function addInviteFields(team) {
  const plain = team.toObject ? team.toObject() : team;
  plain.inviteCode = team.inviteCode;
  plain.inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join-team/${team.inviteCode}`;
  return plain;
}

// @desc    Get user's teams
// @route   GET /api/teams/my-teams
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id, 'members.status': 'accepted' }
      ]
    })
      .populate('event', 'name startDate endDate status')
      .populate('leader', 'firstName lastName')
      .populate('members.user', 'firstName lastName');

    // Add inviteCode and inviteLink to each team
    res.json(teams.map(addInviteFields));
  } catch (error) {
    console.error('Get my teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team details
// @route   GET /api/teams/:teamId
// @access  Private (Team members only)
const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('event', 'name startDate endDate status')
      .populate('leader', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member
    const isMember = team.members.some(m => m.user._id.toString() === req.user._id.toString());
    const isLeader = team.leader._id.toString() === req.user._id.toString();

    if (!isMember && !isLeader) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add inviteCode and inviteLink
    res.json(addInviteFields(team));
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Leave team
// @route   DELETE /api/teams/:teamId/leave
// @access  Private
const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.registrationComplete) {
      return res.status(400).json({ message: 'Cannot leave after registration is complete' });
    }

    // Team leader cannot leave (must disband instead)
    if (team.leader.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Team leader cannot leave. Disband the team instead.' });
    }

    team.members = team.members.filter(m => m.user.toString() !== req.user._id.toString());
    
    // Update isComplete status
    const acceptedCount = team.members.filter(m => m.status === 'accepted').length;
    team.isComplete = acceptedCount >= team.minSize;
    
    await team.save();

    res.json({ message: 'Left team successfully' });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Disband team
// @route   DELETE /api/teams/:teamId
// @access  Private (Team leader only)
const disbandTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can disband the team' });
    }

    if (team.registrationComplete) {
      return res.status(400).json({ message: 'Cannot disband after registration is complete' });
    }

    await Team.findByIdAndDelete(req.params.teamId);

    res.json({ message: 'Team disbanded successfully' });
  } catch (error) {
    console.error('Disband team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send team chat message
// @route   POST /api/teams/:teamId/chat
// @access  Private (Team members only)
const sendTeamMessage = async (req, res) => {
  try {
    const { message, fileUrl } = req.body;
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member
    const isMember = team.members.some(
      m => m.user.toString() === req.user._id.toString() && m.status === 'accepted'
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const chatMessage = {
      sender: req.user._id,
      message,
      fileUrl,
      sentAt: new Date()
    };

    team.chatMessages.push(chatMessage);
    await team.save();

    // Get the saved message with populated sender
    const populatedTeam = await Team.findById(team._id)
      .populate('chatMessages.sender', 'firstName lastName');
    
    const savedMessage = populatedTeam.chatMessages[populatedTeam.chatMessages.length - 1];

    // Emit via socket
    const io = req.app.get('io');
    io.to(`team_${team._id}`).emit('newTeamMessage', savedMessage);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Send team message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get team chat history
// @route   GET /api/teams/:teamId/chat
// @access  Private (Team members only)
const getTeamChat = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('chatMessages.sender', 'firstName lastName');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member
    const isMember = team.members.some(
      m => m.user.toString() === req.user._id.toString() && m.status === 'accepted'
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    res.json(team.chatMessages);
  } catch (error) {
    console.error('Get team chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Invite a member to the team
// @route   POST /api/teams/:teamId/invite
// @access  Private (Team leader only)
const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const team = await Team.findById(req.params.teamId)
      .populate('event')
      .populate('leader', 'firstName lastName email');

    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only leader can invite
    if (team.leader._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only leader can invite members' });
    }

    // Find or create user by email
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, firstName: '', lastName: '' });
    }

    // Check if already invited or member
    const already = team.members.find(m => m.user.toString() === user._id.toString());
    if (already) return res.status(400).json({ message: 'User already invited or member' });

    // Add to team as pending
    team.members.push({ user: user._id, status: 'pending', invitedAt: new Date() });
    await team.save();

    // Generate QR code for join link
    const joinLink = `${process.env.FRONTEND_URL}/join-team/${team.inviteCode}`;
    const qrCode = await generateQRCode({ joinLink, teamId: team._id });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'felicity.events@gmail.com',
      to: email,
      subject: `Invitation to join team ${team.name} for ${team.event.name}`,
      html: `
        <h1>Team Invitation</h1>
        <p>You have been invited to join team <strong>${team.name}</strong> for <strong>${team.event.name}</strong>.</p>
        <p>Click <a href="${joinLink}">here</a> to join, or scan the QR code below:</p>
        <img src="${qrCode}" alt="QR Code" style="max-width: 200px;"/>
      `
    });

    res.json({ message: 'Invitation sent!' });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
