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

Common Topics You Can Help With:
- Order status and tracking
- Product information and recommendations
- Return and refund policies
- Payment issues
- Shipping information
- General inquiries

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
