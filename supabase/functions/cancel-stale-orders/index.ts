import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the cutoff time (30 minutes ago)
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    console.log(`Looking for orders in 'awaiting_payment' status created before: ${cutoffTime}`);

    // Find all orders that are in 'awaiting_payment' status for more than 30 minutes
    const { data: staleOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, created_at, coupon_code')
      .eq('status', 'awaiting_payment')
      .lt('created_at', cutoffTime);

    if (fetchError) {
      console.error('Error fetching stale orders:', fetchError);
      throw fetchError;
    }

    if (!staleOrders || staleOrders.length === 0) {
      console.log('No stale orders found');
      return new Response(
        JSON.stringify({ success: true, message: 'No stale orders to cancel', cancelled: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${staleOrders.length} stale order(s) to cancel`);

    const cancelledOrders = [];

    for (const order of staleOrders) {
      console.log(`Processing order ${order.id}, created at ${order.created_at}`);

      // Cancel the order
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      if (updateError) {
        console.error(`Error cancelling order ${order.id}:`, updateError);
        continue;
      }

      // If coupon was used, reverse the usage count
      if (order.coupon_code) {
        console.log(`Reversing coupon usage for ${order.coupon_code}`);
        
        // Get current coupon data
        const { data: couponData } = await supabase
          .from('coupons')
          .select('id, used_count')
          .eq('code', order.coupon_code)
          .single();

        if (couponData && couponData.used_count > 0) {
          await supabase
            .from('coupons')
            .update({ used_count: couponData.used_count - 1 })
            .eq('id', couponData.id);
        }

        // Delete coupon usage record
        await supabase
          .from('coupon_usage')
          .delete()
          .eq('order_id', order.id);
      }

      cancelledOrders.push(order.id);
      console.log(`Successfully cancelled order ${order.id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cancelled ${cancelledOrders.length} stale order(s)`,
        cancelled: cancelledOrders.length,
        orderIds: cancelledOrders
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in cancel-stale-orders function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
