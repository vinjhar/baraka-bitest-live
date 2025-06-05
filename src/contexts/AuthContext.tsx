import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser, AuthError, Session } from '@supabase/supabase-js';

type User = {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  recipeCount: number;
  savedRecipes: string[];
  emailConfirmed: boolean;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  incrementRecipeCount: () => void;
  hasReachedLimit: boolean;
  setUserPremium: (isPremium: boolean) => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_RESET_ATTEMPTS = 3;
const resetAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_SIGNUP_ATTEMPTS = 3;
const signupAttempts = new Map<string, { count: number; timestamp: number }>();

const createUserObject = (
  supabaseUser: SupabaseUser,
  recipeCount = 0,
  isPremium = false,
  emailConfirmed = false
): User => ({
  id: supabaseUser.id,
  name: supabaseUser.user_metadata.name || 'User',
  email: supabaseUser.email!,
  isPremium,
  recipeCount,
  savedRecipes: [],
  emailConfirmed
});

const STORAGE_KEY = 'barakaAuthState';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    error: null,
  });
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const navigate = useNavigate();
  const initializationAttempts = useRef(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    if (authState.isLoading && !authState.isInitialized) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('Auth loading timeout reached, forcing initialization complete');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: 'Authentication initialization timed out',
        }));
      }, 10000); // 10 second timeout
    } else if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [authState.isLoading, authState.isInitialized]);

  const checkSubscriptionStatus = useCallback(async (userId: string) => {
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', userId)
        .single();

      if (customerError) {
        if (customerError.code === 'PGRST116') {
          return false;
        }
        return false;
      }

      if (!customerData?.customer_id) {
        return false;
      }

      const { data: subscription, error: subscriptionError } = await supabase
        .from('stripe_subscriptions')
        .select('status')
        .eq('customer_id', customerData.customer_id)
        .is('deleted_at', null)
        .single();

      if (subscriptionError) {
        if (subscriptionError.code === 'PGRST116') {
          return false;
        }
        return false;
      }

      return subscription?.status === 'active';
    } catch {
      return false;
    }
  }, []);

  const persistAuthState = useCallback((state: Partial<AuthState>) => {
    try {
      const currentState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const newState = { ...currentState, ...state };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to persist auth state:', error);
    }
  }, []);

  const loadPersistedState = useCallback(() => {
    try {
      const state = localStorage.getItem(STORAGE_KEY);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Failed to load persisted auth state:', error);
      return null;
    }
  }, []);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        clearAuthState();
        return;
      }

      const isPremium = await checkSubscriptionStatus(session.user.id);
      const persistedState = loadPersistedState();
      const emailConfirmed = session.user.email_confirmed_at != null;

      const user = createUserObject(
        session.user,
        persistedState?.user?.recipeCount || 0,
        isPremium,
        emailConfirmed
      );

      const newState = {
        user,
        session,
        isAuthenticated: emailConfirmed,
        isLoading: false,
        isInitialized: true,
        error: null,
      };

      setAuthState(newState);
      persistAuthState(newState);
    } catch (error) {
      console.error('Session refresh failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh session',
        isInitialized: true,
      }));
    }
  }, [checkSubscriptionStatus, clearAuthState, loadPersistedState, persistAuthState]);

  const initializeAuth = useCallback(async () => {
    console.log('Initializing auth...');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Initializing auth...2', session, sessionError);
      if (sessionError || !session || !session.user) {
        console.log('No valid session found');
        setAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          error: sessionError?.message || null,
        });
        return;
      }
      console.log('Initializing auth...3', session, sessionError);

      // Proceed with valid session
      const persistedState = loadPersistedState();
      const isPremium = await checkSubscriptionStatus(session.user.id);
      const emailConfirmed = !!session.user.email_confirmed_at;

      const user = createUserObject(
        session.user,
        persistedState?.user?.recipeCount || 0,
        isPremium,
        emailConfirmed
      );

      const newState = {
        user,
        session,
        isAuthenticated: emailConfirmed,
        isLoading: false,
        isInitialized: true,
        error: null,
      };

      console.log('Auth initialized successfully');
      setAuthState(newState);
      persistAuthState(newState);

    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: 'Failed to initialize authentication',
      });
    }
  }, [checkSubscriptionStatus, loadPersistedState, persistAuthState]);


  useEffect(() => {
    let mounted = true;
    let isInitializing = true;

    const init = async () => {
      if (mounted) {
        await initializeAuth();
        isInitializing = false;
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);

      if (!mounted) return;

      // Skip auth state changes during initial initialization
      if (isInitializing && event === 'SIGNED_IN') {
        console.log('Skipping initial SIGNED_IN event');
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        // Only handle automatic navigation if we're not on the reset password page
        if (!window.location.pathname.includes('reset-password')) {
          try {
            const isPremium = await checkSubscriptionStatus(session.user.id);
            const emailConfirmed = session.user.email_confirmed_at != null;

            const { data: profileData } = await supabase
              .from('profiles')
              .select('generations_left')
              .eq('user_id', session.user.id)
              .single();

            const generationsLeft = profileData?.generations_left || 0;

            const user = createUserObject(
              session.user,
              generationsLeft,
              isPremium,
              emailConfirmed
            );

            const newState = {
              user,
              session,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
            };

            setAuthState(newState);
            persistAuthState(newState);

            if (emailConfirmed) {
              navigate('/dashboard');
            } else {
              navigate('/email-confirmation');
            }
          } catch (error) {
            console.error('Error handling sign in:', error);
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Failed to complete sign in',
            }));
          }
        }
      } else if (event === 'SIGNED_OUT') {
        clearAuthState();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setAuthState(prev => ({ ...prev, session }));
        persistAuthState({ session });
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const sessionCheckInterval = setInterval(refreshSession, 5 * 60 * 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
    };
  }, [initializeAuth, checkSubscriptionStatus, clearAuthState, loadPersistedState, persistAuthState, refreshSession, navigate]);

  useEffect(() => {
    if (authState.user && !authState.user.isPremium && authState.user.recipeCount >= 3) {
      setHasReachedLimit(true);
    } else {
      setHasReachedLimit(false);
    }
  }, [authState.user]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Starting login for:', email);
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email before signing in. Check your inbox for the confirmation link.');
        }
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to sign in',
        }));
        throw error;
      }

      if (data.user && !data.user.email_confirmed_at) {
        throw new Error('Please confirm your email before signing in. Check your inbox for the confirmation link.');
      }

      console.log('Login successful, waiting for auth state change...');
      // The auth state change will be handled by the onAuthStateChange listener
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sign in',
      }));
      throw error;
    }
  };

  const checkSignupRateLimit = (email: string): boolean => {
    const now = Date.now();
    const userAttempts = signupAttempts.get(email);

    if (!userAttempts) {
      signupAttempts.set(email, { count: 1, timestamp: now });
      return true;
    }

    if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
      signupAttempts.set(email, { count: 1, timestamp: now });
      return true;
    }

    if (userAttempts.count >= MAX_SIGNUP_ATTEMPTS) {
      return false;
    }

    signupAttempts.set(email, {
      count: userAttempts.count + 1,
      timestamp: userAttempts.timestamp
    });
    return true;
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check rate limit first
      if (!checkSignupRateLimit(email)) {
        throw new Error(`Too many signup attempts. Please wait ${RATE_LIMIT_WINDOW / 1000} seconds before trying again.`);
      }

      // First check if the email exists
      const { data: existingUser, error: userError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      if (!userError) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth?type=signup`
        }
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Too many signup attempts. Please try again later.');
        }
        throw error;
      }

      if (data.user && !data.session) {
        // User needs to confirm email
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return;
      }

      // If there's a session, it will be handled by onAuthStateChange

    } catch (error: any) {
      console.error('Signup error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sign up',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut(); // Ensure async sign out completes
      localStorage.removeItem('barakaAuthState'); // Clear persisted state
      clearAuthState(); // Clear React state

      // Optional: Add a slight delay to ensure Supabase cleans up before reload
      setTimeout(() => {
        window.location.href = '/auth'; // Navigate instead of reload
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error.message || 'Failed to sign out',
      }));
    }
  };



  const checkResetRateLimit = (email: string): boolean => {
    const now = Date.now();
    const userAttempts = resetAttempts.get(email);

    if (!userAttempts) {
      resetAttempts.set(email, { count: 1, timestamp: now });
      return true;
    }

    if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
      resetAttempts.set(email, { count: 1, timestamp: now });
      return true;
    }

    if (userAttempts.count >= MAX_RESET_ATTEMPTS) {
      return false;
    }

    resetAttempts.set(email, {
      count: userAttempts.count + 1,
      timestamp: userAttempts.timestamp
    });
    return true;
  };

  const resetPassword = async (email: string) => {
    if (!checkResetRateLimit(email)) {
      throw new Error('Too many reset attempts. Please wait a minute before trying again.');
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Directly send password reset email; Supabase will handle if email exists or not
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      setAuthState(prev => ({ ...prev, isLoading: false }));

      if (error) {
        throw error;
      }

      // Show generic success message regardless
      setAuthState(prev => ({
        ...prev,
        message: 'If an account exists with this email, you will receive password reset instructions. Please check your inbox.'
      }));

    } catch (error: any) {
      console.error('Reset password error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'An unexpected error occurred.',
      }));
    }
  };


  const incrementRecipeCount = useCallback(async () => {
    if (authState.user) {
      // Decrement generations_left for free users
      const newCount = authState.user.isPremium ? authState.user.recipeCount : authState.user.recipeCount - 1;
      const newUser = { ...authState.user, recipeCount: newCount };

      try {
        // Update generations left in the 'profiles' table
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: authState.user.id,
            generations_left: newCount, // Update generations_left
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        setAuthState((prev: AuthState) => ({
          ...prev,
          user: newUser,
        }));

        persistAuthState({ user: newUser });
      } catch (error) {
        console.error('Error updating generations left:', error);
      }
    }
  }, [authState.user, persistAuthState]);

  const setUserPremium = useCallback((isPremium: boolean) => {
    if (authState.user) {
      const newUser = { ...authState.user, isPremium };
      setAuthState(prev => ({
        ...prev,
        user: newUser,
      }));
      persistAuthState({ user: newUser });
    }
  }, [authState.user, persistAuthState]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        resetPassword,
        incrementRecipeCount,
        hasReachedLimit,
        setUserPremium,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};