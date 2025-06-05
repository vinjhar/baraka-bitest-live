import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft, Leaf } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login, signup, resetPassword, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Only redirect to dashboard if authenticated (email confirmed)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const type = searchParams.get('type');
      
      if (type === 'signup') {
        if (searchParams.get('error_description')) {
          setError('Email confirmation failed. Please try signing up again.');
        } else {
          setSuccessMessage('Email confirmed successfully! Please sign in below.');
          setIsSignUp(false); // Switch to login form
        }
      }
    };

    handleEmailConfirmation();
  }, [searchParams]);

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your name');
        }
        await signup(name.trim(), email.trim(), password);
        setSuccessMessage('Please check your email to confirm your account.');
      } else {
        await login(email.trim(), password);
        // Navigation will be handled by the useEffect above or by the login function
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await resetPassword(email.trim());
      setSuccessMessage('Password reset instructions have been sent to your email.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if auth context is still loading
  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-primary">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is already authenticated, don't show the auth page
  if (isAuthenticated) {
    return null;
  }

  // If there's an error, show it but don't block the auth form
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center items-center">
              <Leaf className="w-8 h-8 text-primary rotate-45" />
              <div className="flex flex-col ml-2">
                <span className="text-3xl font-serif text-primary">Baraka</span>
                <span className="text-sm font-medium tracking-wider text-primary/80">BITES</span>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-primary">
              {isForgotPassword
                ? 'Reset your password'
                : isSignUp
                  ? 'Create your account'
                  : 'Sign in to your account'
              }
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isForgotPassword
                ? 'Enter your email to receive reset instructions'
                : isSignUp
                  ? 'Join Baraka Bites today'
                  : 'Welcome back to Baraka Bites'
              }
            </p>

            {isSignUp && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Sign Up Requirements:</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Password must be at least 8 characters long</li>
                  <li>Maximum 3 signup attempts per minute</li>
                  <li>Email must be unique and not already registered</li>
                  <li>You will need to confirm your email after signing up</li>
                </ul>
              </div>
            )}
          </div>

          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
            {isForgotPassword ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            ) : (
              <>
                {isSignUp && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            {!isSignUp && !isForgotPassword && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || authLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span>{isForgotPassword ? 'Sending...' : isSignUp ? 'Signing Up...' : 'Signing In...'}</span>
                  </div>
                ) : (
                  isForgotPassword ? 'Send Reset Instructions' : isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="flex items-center justify-center w-full text-sm text-primary hover:text-primary/80"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </button>
            ) : (
              <p className="text-sm text-gray-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="ml-1 font-medium text-primary hover:text-primary/80"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center items-center">
            <Leaf className="w-8 h-8 text-primary rotate-45" />
            <div className="flex flex-col ml-2">
              <span className="text-3xl font-serif text-primary">Baraka</span>
              <span className="text-sm font-medium tracking-wider text-primary/80">BITES</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-primary">
            {isForgotPassword
              ? 'Reset your password'
              : isSignUp
                ? 'Create your account'
                : 'Sign in to your account'
            }
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isForgotPassword
              ? 'Enter your email to receive reset instructions'
              : isSignUp
                ? 'Join Baraka Bites today'
                : 'Welcome back to Baraka Bites'
            }
          </p>

          {isSignUp && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Sign Up Requirements:</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Password must be at least 8 characters long</li>
                <li>Maximum 3 signup attempts per minute</li>
                <li>Email must be unique and not already registered</li>
                <li>You will need to confirm your email after signing up</li>
              </ul>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
          {isForgotPassword ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : (
            <>
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {!isSignUp && !isForgotPassword && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="font-medium text-primary hover:text-primary/80"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>{isForgotPassword ? 'Sending...' : isSignUp ? 'Signing Up...' : 'Signing In...'}</span>
                </div>
              ) : (
                isForgotPassword ? 'Send Reset Instructions' : isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          {isForgotPassword ? (
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="flex items-center justify-center w-full text-sm text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </button>
          ) : (
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="ml-1 font-medium text-primary hover:text-primary/80"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;