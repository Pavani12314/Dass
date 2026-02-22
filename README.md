# Felicity Event Management System

A comprehensive MERN stack application for managing college cultural fest events, clubs, and participant registrations.

## Features

### Core Features (70 Marks)
- **Participant Module**
  - User registration and authentication (IIIT email validation)
  - Browse and filter events by category, date, popularity
  - Event registration with custom form fields
  - View event tickets with QR codes
  - Follow clubs/organizers
  - View and manage registrations

- **Organizer Module**
  - Create and manage events with custom registration forms
  - View and manage registrations
  - Approve/reject participant registrations
  - Export registrations to CSV
  - Discord webhook integration for event notifications

- **Admin Module**
  - Manage club/organizer accounts (create, disable, delete)
  - View system statistics
  - Handle password reset requests

---

## Advanced Features Implementation (30 Marks)

### Tier A: Core Advanced Features [2 Features - 16 Marks]

#### 1. Hackathon Team Registration (8 Marks) ✅
**Justification**: Essential for technical fests where hackathons are a major attraction. Teams need proper management for collaborative events.

**Implementation**:
- Team leader creates team with configurable team size
- Unique invite code generated for each team
- Members join via invite code or link
- Registration marked complete only when team is fully formed
- Team management dashboard with invite tracking
- Automatic ticket generation for all team members upon completion

**Files**: `models/Team.js`, `controllers/teamController.js`, `routes/teams.js`, `pages/participant/Teams.jsx`

#### 2. QR Scanner & Attendance Tracking (8 Marks) ✅
**Justification**: Critical for event operations - organizers need efficient check-in and accurate attendance data.

**Implementation**:
- Built-in QR scanner using device camera (html5-qrcode)
- Real-time ticket validation with backend verification
- Attendance marking with timestamp
- Duplicate scan rejection with existing attendance info
- Live attendance dashboard (scanned vs not-yet-scanned)
- Export attendance reports as CSV
- Manual override option with audit logging (reason tracking)

**Files**: `controllers/ticketController.js` (scanTicket, manualOverride, getAttendanceStats, exportAttendance), `pages/organizer/QRScanner.jsx`

---

### Tier B: Real-time & Communication Features [2 Features - 12 Marks]

#### 1. Real-Time Discussion Forum (6 Marks) ✅
**Justification**: Enhances participant engagement and allows organizers to communicate updates efficiently.

**Implementation**:
- Real-time messaging using Socket.io
- Event-specific forum rooms
- Message threading support (parentMessage references)
- Organizer moderation (delete/pin messages)
- Announcement posting by organizers
- Message reactions (emoji support)
- Notification system for new messages

**Files**: `models/ForumMessage.js`, `controllers/forumController.js`, `routes/forum.js`, `pages/participant/Forum.jsx`, `services/socket.js`

#### 2. Organizer Password Reset Workflow (6 Marks) ✅
**Justification**: Security requirement - organizers cannot self-reset passwords, requiring admin verification.

**Implementation**:
- Organizers request password reset from Profile page
- Admin views all pending requests with details (club name, date, reason)
- Admin can approve or reject with comments
- On approval, system auto-generates new password
- Admin receives credentials to share with organizer
- Request status tracking (Pending/Approved/Rejected)
- Password reset history maintained

**Files**: `models/PasswordResetRequest.js`, `controllers/adminController.js`, `routes/admin.js`, `pages/admin/PasswordResets.jsx`, `pages/organizer/Profile.jsx`

---

### Tier C: Integration & Enhancement Features [1 Feature - 2 Marks]

#### 1. Anonymous Feedback System (2 Marks) ✅
**Justification**: Enables honest feedback collection for event improvement without participant hesitation.

**Implementation**:
- Star rating (1-5) for attended events
- Text-based comments
- Optional anonymity toggle
- Organizers view aggregated ratings
- Filter feedback by rating
- Average ratings and feedback statistics
- Export feedback data for analysis

**Files**: `models/Feedback.js`, `controllers/feedbackController.js`, `routes/feedback.js`, `pages/participant/Feedback.jsx`

---

## Total Advanced Features Score: 16 + 12 + 2 = 30 Marks

## Tech Stack

- **Frontend**: React 18 + Vite, Material-UI, React Router v6
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **QR Codes**: qrcode (generation), html5-qrcode (scanning)
- **File Upload**: Multer

## Project Structure

```
assignment/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── eventController.js
│   │   ├── feedbackController.js
│   │   ├── forumController.js
│   │   ├── organizerController.js
│   │   ├── teamController.js
│   │   ├── ticketController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── Event.js
│   │   ├── Feedback.js
│   │   ├── ForumMessage.js
│   │   ├── Organizer.js
│   │   ├── PasswordResetRequest.js
│   │   ├── Registration.js
│   │   ├── Team.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── feedback.js
│   │   ├── forum.js
│   │   ├── organizers.js
│   │   ├── teams.js
│   │   ├── tickets.js
│   │   └── users.js
│   ├── seeds/
│   │   └── adminSeed.js
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventCard.jsx
│   │   │   ├── FormBuilder.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── organizer/
│   │   │   └── participant/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/felicity
   JWT_SECRET=your_super_secret_jwt_key_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FRONTEND_URL=http://localhost:5173
   ```

4. Seed the admin user:
   ```bash
   node seeds/adminSeed.js
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Default Credentials

### Admin
- Email: admin@felicity.com
- Password: admin123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new participant
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (Organizer)
- `PUT /api/events/:id` - Update event (Organizer)
- `DELETE /api/events/:id` - Delete event (Organizer)
- `POST /api/events/:id/register` - Register for event

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/registrations` - Get user registrations
- `POST /api/users/follow/:organizerId` - Follow organizer
- `DELETE /api/users/follow/:organizerId` - Unfollow organizer

### Organizers
- `GET /api/organizers` - Get all organizers
- `GET /api/organizers/:id` - Get organizer details
- `GET /api/organizers/stats` - Get organizer stats
- `GET /api/organizers/events` - Get organizer's events

### Teams
- `POST /api/teams` - Create team
- `GET /api/teams/my-teams` - Get user's teams
- `POST /api/teams/:id/invite` - Invite member
- `POST /api/teams/:id/leave` - Leave team
- `GET /api/teams/:id/messages` - Get team messages

### Forum
- `GET /api/forum/:eventId/messages` - Get forum messages
- `POST /api/forum/:eventId/messages` - Post message

### Tickets
- `GET /api/tickets/:registrationId` - Get ticket details
- `POST /api/tickets/verify` - Verify ticket
- `POST /api/tickets/:id/checkin` - Check in participant

### Admin
- `GET /api/admin/stats` - Get system stats
- `GET /api/admin/clubs` - Get all clubs
- `POST /api/admin/clubs` - Create club
- `PUT /api/admin/clubs/:id` - Update club
- `DELETE /api/admin/clubs/:id` - Delete club
- `GET /api/admin/password-reset-requests` - Get reset requests
- `POST /api/admin/password-reset-requests/:id/approve` - Approve reset

## Socket Events

### Forum
- `joinForum` - Join event forum room
- `leaveForum` - Leave forum room
- `sendForumMessage` - Send message to forum
- `forumMessage` - Receive forum message

### Team Chat
- `joinTeam` - Join team chat room
- `leaveTeam` - Leave team room
- `sendTeamMessage` - Send team message
- `teamMessage` - Receive team message

## Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables
2. Deploy from GitHub repository
3. Run admin seed after deployment

### Frontend (Vercel/Netlify)
1. Set `VITE_API_URL` to your backend URL
2. Deploy from GitHub repository

## License

This project is created for educational purposes as part of a college assignment.
