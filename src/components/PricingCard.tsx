import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { redirectToCheckout } from '../lib/stripe';

type PricingCardProps = {
  title: string;
  price: string;
  description: string;
  features: string[];
  priceId: string | null;
  mode: 'payment' | 'subscription';
  isHighlighted?: boolean;
};

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  description,
  features,
  priceId,
  mode,
  isHighlighted = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const handleUpgrade = async () => {
    console.log('Starting upgrade process...', { priceId, mode, isAuthenticated });

    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to auth page');
      window.location.href = '/auth';
      return;
    }

    if (!priceId) {
      console.error('No price ID provided');
      setError('Invalid subscription plan. Please contact support.');
      return;
    }

    try {
      resetState();
      setIsLoading(true);
      console.log('Initiating checkout process...', { priceId, mode });

      // Set timeout to prevent infinite loading
      const newTimeoutId = window.setTimeout(() => {
        console.error('Checkout process timed out');
        setError('Request timed out. Please try again.');
        setIsLoading(false);
      }, 30000); // 30 second timeout
      setTimeoutId(newTimeoutId);

      // Verify price ID format
      if (!priceId.startsWith('price_')) {
        console.error('Invalid price ID format:', priceId);
        throw new Error('Invalid subscription plan. Please contact support.');
      }

      console.log('Creating checkout session...');
      const checkoutUrl = await redirectToCheckout(priceId, mode);
      console.log('Received checkout URL:', checkoutUrl);
      
      if (!checkoutUrl) {
        console.error('No checkout URL received');
        throw new Error('Failed to generate checkout URL');
      }

      // Clear timeout as we're about to redirect
      resetState();

      console.log('Redirecting to Stripe checkout...');
      // Use a more reliable redirect method
      try {
        window.location.assign(checkoutUrl);
      } catch (redirectError) {
        console.error('Primary redirect failed, trying fallback:', redirectError);
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      
      // Determine user-friendly error message
      let errorMessage = 'Failed to start checkout process. Please try again.';
      if (err.message.includes('session has expired')) {
        errorMessage = 'Your session has expired. Please sign in again.';
      } else if (err.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message.includes('customer')) {
        errorMessage = 'Unable to create customer profile. Please try again or contact support.';
      } else if (err.message.includes('price')) {
        errorMessage = 'Invalid subscription plan. Please contact support.';
      } else if (err.message.includes('permission')) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (err.message.includes('too many requests')) {
        errorMessage = 'Too many requests. Please try again in a few minutes.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg 
        ${isHighlighted ? 'border-2 border-gold scale-105 relative' : 'border border-primary/10'}`}
    >
      {isHighlighted && (
        <div className="bg-gold text-primary text-center py-1 font-semibold">
          Most Popular
        </div>
      )}
      
      <div className={`p-6 ${isHighlighted ? 'bg-white' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-2 ${isHighlighted ? 'text-primary' : 'text-primary'}`}>
          {title}
        </h3>
        
        <div className="mb-4">
          <span className={`text-3xl font-bold ${isHighlighted ? 'text-primary' : 'text-primary'}`}>
            {price}
          </span>
          {mode === 'subscription' && (
            <span className="text-gray-500 ml-1">/month</span>
          )}
        </div>
        
        <p className="text-gray-700 mb-6">{description}</p>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className={`w-5 h-5 mr-2 mt-0.5 ${isHighlighted ? 'text-gold' : 'text-primary'}`} />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <button 
          onClick={handleUpgrade}
          disabled={isLoading || !priceId}
          className={`w-full flex justify-center items-center py-3 px-4 rounded-md font-medium transition-all duration-200 
            ${isHighlighted 
              ? 'bg-gold text-primary hover:bg-gold/90' 
              : 'bg-primary text-white hover:bg-primary/90'}
            ${(isLoading || !priceId) ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            !priceId ? 'Current Plan' : (isAuthenticated ? 'Upgrade Now' : 'Sign In to Upgrade')
          )}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;