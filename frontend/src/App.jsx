import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Landing page
import LandingPage from './pages/LandingPage';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Onboarding from './pages/auth/Onboarding';

// Participant pages
import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import ClubsPage from './pages/participant/ClubsPage';
import OrganizerDetail from './pages/participant/OrganizerDetail';
import ParticipantProfile from './pages/participant/Profile';
import Teams from './pages/participant/Teams';
import TeamChat from './pages/participant/TeamChat';
import Forum from './pages/participant/Forum';
import TicketView from './pages/participant/TicketView';
import Feedback from './pages/participant/Feedback';

// Organizer pages
import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import MyEvents from './pages/organizer/MyEvents';
import OrganizerEventDetail from './pages/organizer/EventDetail';
import OrganizerProfile from './pages/organizer/Profile';
import QRScanner from './pages/organizer/QRScanner';
import EditEvent from './pages/organizer/EditEvent';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageClubs from './pages/admin/ManageClubs';
import PasswordResets from './pages/admin/PasswordResets';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0a0a1a',
        gap: '20px',
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
          animation: 'pulse 1.5s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
        }} />
        <div style={{
          color: '#a5b4fc',
          fontSize: '1.2rem',
          fontWeight: 500,
          letterSpacing: '0.1em',
        }}>
          Loading Felicity...
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Aurora effect */}
      <div className="aurora" />
      
      {/* Hexagon pattern */}
      <div className="hex-pattern" />
      
      {/* Grid pattern */}
      <div className="grid-pattern" />
      
      {/* Neon border */}
      <div className="neon-border" />
      
      {/* Glitch overlay */}
      <div className="glitch-overlay" />
      
      {/* Corner decorations */}
      <div className="corner-decoration corner-tl" />
      <div className="corner-decoration corner-br" />
      
      {/* Radar sweep */}
      <div className="radar" />
      
      {/* DNA strands */}
      <div className="dna-strand dna-1" />
      <div className="dna-strand dna-2" />
      
      {/* Animated rings */}
      <div className="animated-ring ring-1" />
      <div className="animated-ring ring-2" />
      <div className="animated-ring ring-3" />
      
      {/* Gradient orbs */}
      <div className="gradient-orb orb-purple" />
      <div className="gradient-orb orb-pink" />
      <div className="gradient-orb orb-blue" />
      
      {/* Floating bubbles */}
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2" />
      <div className="bubble bubble-3" />
      <div className="bubble bubble-4" />
      <div className="bubble bubble-5" />
      <div className="bubble bubble-6" />
      
      {/* Animated background shapes */}
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />
      <div className="bg-shape shape-4" />
      <div className="bg-shape shape-5" />
      
      {/* Glowing lines */}
      <div className="glow-line line-1" />
      <div className="glow-line line-2" />
      <div className="glow-line line-3" />
      
      {/* Shooting stars */}
      <div className="shooting-star star-1" />
      <div className="shooting-star star-2" />
      <div className="shooting-star star-3" />
      
      {/* Floating event icons */}
      <div className="floating-icon icon-1">🎉</div>
      <div className="floating-icon icon-2">🎭</div>
      <div className="floating-icon icon-3">🎪</div>
      <div className="floating-icon icon-4">🎯</div>
      <div className="floating-icon icon-5">🎨</div>
      <div className="floating-icon icon-6">🎵</div>
      <div className="floating-icon icon-7">⭐</div>
      <div className="floating-icon icon-8">🚀</div>
      
      {/* Animated waves at bottom */}
      <div className="wave-container">
        <div className="wave" />
        <div className="wave" />
        <div className="wave" />
      </div>
      
      {user && <Navbar />}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

        {/* Onboarding */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute roles={['participant']}>
              <Onboarding />
            </ProtectedRoute>
          } 
        />

        {/* Root redirect based on role */}
        <Route 
          path="/" 
          element={
            user ? (
              user.role === 'participant' ? <Navigate to="/participant/dashboard" /> :
              user.role === 'organizer' ? <Navigate to="/organizer/dashboard" /> :
              user.role === 'admin' ? <Navigate to="/admin/dashboard" /> :
              <Navigate to="/login" />
            ) : <LandingPage />
          } 
        />

        {/* Participant routes */}
        <Route 
          path="/participant/dashboard" 
          element={
            <ProtectedRoute roles={['participant']}>
              <ParticipantDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/events" 
          element={
            <ProtectedRoute roles={['participant']}>
              <BrowseEvents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/events/:id" 
          element={
            <ProtectedRoute roles={['participant']}>
              <EventDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/clubs" 
          element={
            <ProtectedRoute roles={['participant']}>
              <ClubsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/clubs/:id" 
          element={
            <ProtectedRoute roles={['participant']}>
              <OrganizerDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/profile" 
          element={
            <ProtectedRoute roles={['participant']}>
              <ParticipantProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/teams" 
          element={
            <ProtectedRoute roles={['participant']}>
              <Teams />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/teams/:teamId/chat" 
          element={
            <ProtectedRoute roles={['participant']}>
              <TeamChat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/forum/:eventId" 
          element={
            <ProtectedRoute roles={['participant']}>
              <Forum />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/ticket/:registrationId" 
          element={
            <ProtectedRoute roles={['participant']}>
              <TicketView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/participant/feedback/:eventId" 
          element={
            <ProtectedRoute roles={['participant']}>
              <Feedback />
            </ProtectedRoute>
          } 
        />

        {/* Organizer routes */}
        <Route 
          path="/organizer/dashboard" 
          element={
            <ProtectedRoute roles={['organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizer/events" 
          element={
            <ProtectedRoute roles={['organizer']}>
              <MyEvents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizer/events/create" 
          element={
            <ProtectedRoute roles={['organizer']}>
              <CreateEvent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizer/events/:id" 
          element={
            <ProtectedRoute roles={['organizer']}>
              <OrganizerEventDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizer/events/:id/edit" 
          element={
            <ProtectedRoute roles={["organizer"]}>
              <EditEvent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizer/profile" 
          element={
            <ProtectedRoute roles={['organizer']}>
              <OrganizerProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizer/scanner/:eventId" 
          element={
            <ProtectedRoute roles={['organizer']}>
              <QRScanner />
            </ProtectedRoute>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/clubs" 
          element={
            <ProtectedRoute roles={['admin']}>
              <ManageClubs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/password-resets" 
          element={
            <ProtectedRoute roles={['admin']}>
              <PasswordResets />
            </ProtectedRoute>
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </div>
    </>
  );
}

export default App;
