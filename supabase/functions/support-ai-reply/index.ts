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
    const { message, conversationId, userId } = await req.json();
    
    if (!message || !conversationId || !userId) {
      throw new Error("Missing required fields: message, conversationId, userId");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recent messages for context
    const { data: recentMessages, error: msgError } = await supabase
      .from('support_messages')
      .select('sender_type, message, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) {
      console.error("Error fetching messages:", msgError);
    }

    // Build conversation context
    const conversationHistory = (recentMessages || [])
      .reverse()
      .map(m => ({
        role: m.sender_type === 'customer' ? 'user' : 'assistant',
        content: m.message
      }));

    // Fetch product info for context
    const { data: products } = await supabase
      .from('products')
      .select('name, price, sale_price, description')
      .eq('active', true)
      .limit(5);

    const productContext = products?.map(p => 
      `- ${p.name}: ₹${p.sale_price || p.price} - ${p.description?.slice(0, 100) || 'No description'}`
    ).join('\n') || 'No products available';

    const systemPrompt = `You are a helpful customer support assistant for an e-commerce store. Your name is "Support Bot".

Important Guidelines:
- Be friendly, professional, and helpful
- Keep responses concise and to the point (max 2-3 sentences)
- Help with order inquiries, product questions, returns, and general support
- If you don't know something specific, politely suggest the customer wait for a human agent
- Use simple language and be empathetic
- For order-specific queries, ask for order ID if not provided
- Always offer to help with anything else at the end

Available Products (for reference):
${productContext}

=== FAQ KNOWLEDGE BASE ===

📦 ORDER TRACKING:
- Customers can track orders from "My Orders" section after logging in
- Order statuses: Pending → Confirmed → Shipped → Out for Delivery → Delivered
- Tracking updates are sent via email and shown in the order details page
- Standard delivery takes 3-7 business days depending on location
- Express delivery (if available) takes 1-3 business days
- If order shows "Shipped", customer will receive tracking number via email
- For tracking issues, ask for Order ID and help them locate it

🔄 RETURNS & REFUNDS POLICY:
- 7-day return policy from delivery date for most items
- Items must be unused, unworn, with original tags attached
- Return process: Go to My Orders → Select Order → Click "Return Item"
- Refund is processed within 5-7 business days after we receive the returned item
- Refund goes back to original payment method
- Exchange option available for size/color issues
- Non-returnable items: Innerwear, customized products, sale items marked "Final Sale"
- Free return pickup available for prepaid orders
- For COD orders, refund via bank transfer (customer needs to provide bank details)

💳 PAYMENT METHODS & UTR VERIFICATION:
- We accept: Credit/Debit Cards (Visa, Mastercard, RuPay), UPI, Net Banking, Wallets
- Razorpay is our payment gateway - secure and encrypted
- UPI options: GPay, PhonePe, Paytm, BHIM, and all UPI apps
- Cash on Delivery (COD) available for orders under ₹5000
- EMI options available on orders above ₹3000 (select cards)
- If payment failed but money deducted, it auto-refunds in 5-7 business days
- For payment issues, ask for Order ID and payment method used

🔢 UTR VERIFICATION PROCESS:
- UTR (Unique Transaction Reference) is a 12-digit number for UPI payments
- Customer can find UTR in their UPI app's payment history
- When customer says they paid but order shows pending, ASK FOR UTR NUMBER
- Tell them: "Please share your 12-digit UTR number from your UPI app for quick verification"
- Once UTR is provided, tell them: "Thank you! Our team will verify this UTR within 30 minutes and update your order status."
- UTR format: 12 alphanumeric characters (example: 123456789012)

🚚 SHIPPING INFORMATION:
- Free shipping on orders above ₹499
- Shipping charges: ₹49 for orders below ₹499
- We ship pan-India to all serviceable pin codes
- Check pin code serviceability on product page
- Orders placed before 2 PM ship same day (business days)
- Tracking link sent via SMS/Email once shipped

📞 CONTACT & ESCALATION:
- For urgent issues, customer can email: support@store.com
- Business hours: Mon-Sat, 9 AM - 6 PM IST
- Response time: Within 24 hours
- For complaints or escalations, a human agent will follow up within 4 hours

=== RESPONSE TEMPLATES ===

For "Where is my order?":
→ Ask for Order ID, then explain they can track in My Orders section. If they have Order ID, guide them to check status.

For "How to return?":
→ Explain 7-day policy, Go to My Orders → Select Order → Return Item. Refund in 5-7 days after pickup.

For "Payment failed":
→ Assure money will auto-refund in 5-7 days. If urgent, ask for Order ID and payment details to escalate.

For "I made payment" / "Payment kar diya" / "Paid already" / "Money deducted":
→ ALWAYS ask for UTR number: "Payment verify karne ke liye please apna 12-digit UTR number share karein. Aap yeh apne UPI app (PhonePe/GPay/Paytm) ki payment history mein dekh sakte hain."

For UTR number received (12 digits like 123456789012):
→ Confirm: "Thank you! Aapka UTR received ho gaya hai. Humari team 30 minute mein verify karke order status update kar degi."

For "Cancel order":
→ If order not shipped: Can cancel from My Orders. If shipped: Need to refuse delivery or return after receiving.

For "Change address":
→ If not shipped: Ask them to contact immediately with Order ID. If shipped: Cannot change, may need to refuse and reorder.

If the query requires human intervention (like order modifications, refunds, complaints), acknowledge the issue and let them know a human agent will follow up soon.`;

    console.log("Sending request to AI gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            reply: "I'm currently experiencing high traffic. A human agent will assist you shortly. Thank you for your patience!" 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || 
      "I apologize, but I'm having trouble processing your request. A human agent will assist you shortly.";

    console.log("AI reply generated successfully");

    // Store the AI reply in the database
    const { error: insertError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'admin',
        sender_id: '00000000-0000-0000-0000-000000000000', // System/AI user ID
        message: `🤖 ${aiReply}`,
        is_read: false
      });

    if (insertError) {
      console.error("Error inserting AI reply:", insertError);
      // Don't throw - still return the reply to the user
    }

    return new Response(
      JSON.stringify({ reply: aiReply, stored: !insertError }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in support-ai-reply:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        reply: "I'm sorry, I couldn't process your message. Please try again or wait for a human agent."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
