import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const SubscriptionManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      console.error('Portal session error:', err);
      setError(err.message || 'Failed to open subscription management');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.isPremium) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
      <h3 className="text-lg font-semibold text-primary mb-4">Subscription Management</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <button
        onClick={handleManageSubscription}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          'Manage Subscription'
        )}
      </button>
      
      <p className="mt-2 text-sm text-gray-500 text-center">
        Manage your subscription, update payment method, or cancel anytime
      </p>
    </div>
  );
};

export default SubscriptionManager;