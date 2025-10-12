import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsText } = await req.json();

    if (!newsText || newsText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'News text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Classify the news using Lovable AI
    console.log('Classifying news with Lovable AI...');
    const classificationResponse = await fetch(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a fake news detection AI. Analyze the given news article and respond with ONLY a JSON object in this exact format: {"label": "FAKE" or "REAL", "score": 0.0-1.0, "explanation": "brief explanation"}. The score should indicate confidence (1.0 = very confident).'
            },
            {
              role: 'user',
              content: `Analyze this news article and determine if it's FAKE or REAL:\n\n${newsText}`
            }
          ],
        }),
      }
    );

    if (!classificationResponse.ok) {
      const errorText = await classificationResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI classification error: ${errorText}`);
    }

    const classificationData = await classificationResponse.json();
    console.log('Classification result:', classificationData);
    
    const aiResponse = classificationData.choices[0]?.message?.content?.trim();
    
    // Parse the AI response
    let label = 'UNKNOWN';
    let score = 0.5;
    let explanation = '';
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        label = parsed.label?.toUpperCase() === 'FAKE' ? 'FAKE' : 'REAL';
        score = parseFloat(parsed.score) || 0.5;
        explanation = parsed.explanation || '';
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback: check if response contains FAKE or REAL
      if (aiResponse.toUpperCase().includes('FAKE')) {
        label = 'FAKE';
      } else if (aiResponse.toUpperCase().includes('REAL')) {
        label = 'REAL';
      }
      explanation = aiResponse;
    }

    // Step 2: Save to Supabase database
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    console.log('User fetch result:', { user: !!user, error: userError });
    
    if (userError) {
      console.error('User fetch error:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error: dbError } = await supabaseClient
      .from('detections')
      .insert({
        user_id: user.id,
        news_text: newsText,
        label: label,
        score: score,
        explanation: explanation || null,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        label: label,
        score: score,
        explanation: explanation,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in detect-fake-news function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
