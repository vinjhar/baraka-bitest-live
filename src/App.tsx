import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useSearchParams
} from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { RecipeProvider } from './contexts/RecipeContext';
import ScrollToTop from './components/ScrollToTop'; // import the new component

import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import ContactPage from './pages/ContactPage';
import SunnahFoodsPage from './pages/SunnahFoodsPage';
import BlogPage from './pages/BlogPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';

// This component handles links with query params like ?type=recovery&code=...
const RootHandler: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleRecoveryFlow = async () => {
      const code = searchParams.get('code');


      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code:', error.message);
            navigate('/auth');
            return;
          }

          if (data?.session) {
            navigate('/reset-password?type=recovery');
          } else {
            navigate('/auth');
          }
        } catch (err) {
          console.error('Unexpected error during recovery flow:', err);
          navigate('/auth');
        }
      } else {
        navigate('/home');
      }
    };

    handleRecoveryFlow();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-primary">Processing...</span>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <RecipeProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<RootHandler />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <DashboardPage />
                </AuthGuard>
              } />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/sunnah-foods" element={<SunnahFoodsPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/checkout/success" element={
                <AuthGuard>
                  <CheckoutSuccessPage />
                </AuthGuard>
              } />
              <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
          </Layout>
        </RecipeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
