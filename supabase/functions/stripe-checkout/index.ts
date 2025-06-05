import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0'
  }
});
// Helper function to create responses with CORS headers
function corsResponse(body, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };
  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, {
      status,
      headers
    });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
}
Deno.serve(async (req)=>{
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }
    if (req.method !== 'POST') {
      return corsResponse({
        error: 'Method not allowed'
      }, 405);
    }
    const { price_id, success_url, cancel_url, mode, allow_promotion_codes } = await req.json();
    const error = validateParameters({
      price_id,
      success_url,
      cancel_url,
      mode
    }, {
      cancel_url: 'string',
      price_id: 'string',
      success_url: 'string',
      mode: {
        values: [
          'payment',
          'subscription'
        ]
      }
    });
    if (error) {
      return corsResponse({
        error
      }, 400);
    }
    const authHeader = req.headers.get('Authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);
    if (getUserError) {
      console.error('Auth error:', getUserError);
      return corsResponse({
        error: 'Failed to authenticate user'
      }, 401);
    }
    if (!user) {
      return corsResponse({
        error: 'User not found'
      }, 404);
    }
    // Always try to create a new customer or get existing one
    let customerId;
    try {
      // Check for existing customer
      const { data: existingCustomer, error: getCustomerError } = await supabase.from('stripe_customers').select('customer_id').eq('user_id', user.id).is('deleted_at', null).maybeSingle();
      if (getCustomerError) {
        console.error('Failed to fetch customer information:', getCustomerError);
        throw new Error('Failed to fetch customer information');
      }
      if (!existingCustomer) {
        // Create new Stripe customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id
          }
        });
        console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);
        // Save customer mapping
        const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
          user_id: user.id,
          customer_id: newCustomer.id
        });
        if (createCustomerError) {
          console.error('Failed to save customer mapping:', createCustomerError);
          await stripe.customers.del(newCustomer.id);
          throw new Error('Failed to create customer mapping');
        }
        customerId = newCustomer.id;
      } else {
        customerId = existingCustomer.customer_id;
      }
      // Initialize subscription record if needed
      if (mode === 'subscription') {
        const { error: subscriptionError } = await supabase.from('stripe_subscriptions').upsert({
          customer_id: customerId,
          status: 'not_started'
        }, {
          onConflict: 'customer_id' // ✅ tell it what to match on
        });
        if (subscriptionError) {
          console.error('Failed to initialize subscription record:', subscriptionError);
          throw new Error(`Failed to initialize subscription: ${JSON.stringify(subscriptionError)}`);
        }
      }
      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: [
          'card'
        ],
        line_items: [
          {
            price: price_id,
            quantity: 1
          }
        ],
        mode,
        success_url,
        cancel_url,
        allow_promotion_codes
      });
      console.log(`Created checkout session ${session.id} for customer ${customerId}`);
      return corsResponse({
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      console.error('Checkout error:', error);
      return corsResponse({
        error: error.message
      }, 500);
    }
  } catch (error) {
    console.error('Server error:', error);
    return corsResponse({
      error: error.message
    }, 500);
  }
});
function validateParameters(values, expected) {
  for(const parameter in values){
    const expectation = expected[parameter];
    const value = values[parameter];
    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }
  return undefined;
}