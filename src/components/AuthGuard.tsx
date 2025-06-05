import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type AuthGuardProps = {
  children: React.ReactNode;
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized, error, refreshSession, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (isInitialized && !isLoading) {
        if (!isAuthenticated) {
          navigate('/auth', { state: { from: location.pathname } });
        } else if (user && !user.emailConfirmed) {
          navigate('/email-confirmation');
        }
      }
    };
    
    checkAuth();
  }, [isInitialized, isLoading, isAuthenticated, navigate, location, user]);

  // Show loading state only during initial load
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-primary mb-4">Session Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => refreshSession()}
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors duration-200"
          >
            Refresh Session
          </button>
        </div>
      </div>
    );
  }

  // Only render children if user is authenticated and email is confirmed
  if (isAuthenticated && user?.emailConfirmed) {
    return <>{children}</>;
  }

  return null;
};

export default AuthGuard;