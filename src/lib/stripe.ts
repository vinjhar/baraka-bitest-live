import { supabase } from './supabase';

// Validate Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not defined in environment variables');
}

// Validate required environment variables
const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// Validate environment variables
Object.entries(REQUIRED_ENV_VARS).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription') {
  console.log('Creating checkout session...', { priceId, mode });
  
  const apiUrl = `${REQUIRED_ENV_VARS.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

  try {
    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      console.error('Invalid price ID format:', priceId);
      throw new Error('Invalid subscription plan. Please contact support.');
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Auth session error:', sessionError);
      throw new Error('Please sign in to continue');
    }

    // Get the current origin (works for both localhost and production)
    const origin = window.location.origin;
    
    console.log('Sending checkout request to:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        mode,
        // These URLs are where Stripe will redirect AFTER checkout
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
        allow_promotion_codes: true,
      }),
    });

    const responseData = await response.json();
    console.log('Checkout API response:', { 
      status: response.status, 
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      // Log the full error details
      console.error('Checkout API error:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Your session has expired. Please sign in again.');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please try again in a few minutes.');
      } else if (response.status === 500) {
        // Handle specific 500 error cases
        console.log("error type", responseData.error)
        if (responseData.error?.includes('subscription')) {
          throw new Error('Unable to initialize subscription. Please try again or contact support.');
        } else if (responseData.error?.includes('customer')) {
          throw new Error('Unable to create customer profile. Please try again or contact support.');
        } else if (responseData.error?.includes('price')) {
          throw new Error('Invalid subscription plan. Please contact support.');
        } else if (responseData.error?.includes('stripe')) {
          throw new Error('Payment service error. Please try again or contact support.');
        }
        throw new Error('Server error. Please try again or contact support.');
      }
      
      throw new Error(responseData.error || 'Failed to create checkout session');
    }

    if (!responseData.url) {
      console.error('Missing checkout URL in response:', responseData);
      throw new Error('No checkout URL received from server');
    }

    console.log('Checkout session created successfully:', responseData.url);
    return responseData.url;
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    // Ensure we return a user-friendly error message
    if (error.message.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    } else if (error.message.includes('subscription')) {
      throw new Error('Unable to initialize subscription. Please try again or contact support.');
    } else if (error.message.includes('customer')) {
      throw new Error('Unable to create customer profile. Please try again or contact support.');
    } else if (error.message.includes('price')) {
      throw new Error('Invalid subscription plan. Please contact support.');
    } else if (error.message.includes('stripe')) {
      throw new Error('Payment service error. Please try again or contact support.');
    }
    throw new Error(error.message || 'Failed to create checkout session');
  }
}

export async function redirectToCheckout(priceId: string, mode: 'payment' | 'subscription') {
  console.log('Starting checkout redirect...', { priceId, mode });
  
  try {
    console.log('Calling createCheckoutSession...');
    const url = await createCheckoutSession(priceId, mode);
    console.log('createCheckoutSession response:', url);
    
    if (!url) {
      console.error('No checkout URL received');
      throw new Error('No checkout URL received');
    }
    
    console.log('Redirecting to Stripe checkout...', url);
    // Immediately redirect to Stripe's checkout page
    window.location.href = url;
    return url; // Add return statement to fix linter error
  } catch (error: any) {
    console.error('Redirect to checkout error:', error);
    // Ensure we return a user-friendly error message
    if (error.message.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    } else if (error.message.includes('subscription')) {
      throw new Error('Unable to initialize subscription. Please try again or contact support.');
    } else if (error.message.includes('customer')) {
      throw new Error('Unable to create customer profile. Please try again or contact support.');
    } else if (error.message.includes('price')) {
      throw new Error('Invalid subscription plan. Please contact support.');
    } else if (error.message.includes('stripe')) {
      throw new Error('Payment service error. Please try again or contact support.');
    }
    throw error;
  }
}