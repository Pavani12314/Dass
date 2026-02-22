import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs to complete onboarding
  if (
    user.role === 'participant' && 
    !user.onboardingCompleted && 
    window.location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'participant') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === 'organizer') {
      return <Navigate to="/organizer/dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
