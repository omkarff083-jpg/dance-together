import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount } = await req.json();

    // Get credentials from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching Razorpay credentials from database...');
    
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('razorpay_key_id, razorpay_key_secret, razorpay_enabled')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching payment settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payment settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings?.razorpay_enabled) {
      console.error('Razorpay is not enabled');
      return new Response(
        JSON.stringify({ error: 'Razorpay payments are not enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RAZORPAY_KEY_ID = settings.razorpay_key_id;
    const RAZORPAY_KEY_SECRET = settings.razorpay_key_secret;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured in database');
      return new Response(
        JSON.stringify({ error: 'Razorpay credentials not configured. Please update in Admin Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating Razorpay order for amount:', amount);

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      console.error('Razorpay API error:', order);
      return new Response(
        JSON.stringify({ error: order.error?.description || 'Failed to create order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Razorpay order created:', order.id);

    return new Response(
      JSON.stringify({ order, key_id: RAZORPAY_KEY_ID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});