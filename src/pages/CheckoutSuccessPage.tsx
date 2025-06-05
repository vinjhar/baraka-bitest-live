import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUserPremium } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Payment Successful - Baraka Bites';

    const activatePremium = async () => {
      if (!user) {
        setError('User not found. Please sign in.');
        setIsLoading(false);
        return;
      }
      try {
        const { data: customer, error: fetchError } = await supabase
          .from('stripe_customers')
          .select('*')
          .eq('user_id', user.id);

        console.log("Fetched stripe customer row:", customer);

        // Update premium_subscribed column in stripe_customers table
        const { error: updateError } = await supabase
          .from('stripe_customers')
          .update({ premium_subscribed: true })
          .eq('user_id', user.id);

        if (updateError) {
          throw updateError;
        }

        // Update local auth context
        await setUserPremium(true);

        setIsLoading(false);
      } catch (err: any) {
        setError('Error activating subscription. Please contact support.');
        console.error('Error activating subscription:', err);
        setIsLoading(false);
      }
    };

    activatePremium();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Activating your premium features...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Link
              to="/dashboard"
              className="block w-full px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors duration-200"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/contact"
              className="block w-full px-6 py-3 bg-transparent border-2 border-primary text-primary font-medium rounded-md hover:bg-primary/10 transition-colors duration-200"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-primary mb-4">
            Thank You for Your Purchase!
          </h1>

          <p className="text-gray-700 mb-6">
            Your payment was successful and your account is now upgraded to premium. Enjoy all the premium features!
          </p>

          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors duration-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
