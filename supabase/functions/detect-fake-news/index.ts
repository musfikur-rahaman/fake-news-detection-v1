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

    // Step 1: Classify the news using Hugging Face model
    const HF_API_TOKEN = Deno.env.get('HUGGING_FACE_API_KEY');
    
    if (!HF_API_TOKEN) {
      throw new Error('HUGGING_FACE_API_KEY not configured');
    }
    
    console.log('Classifying news with Hugging Face...');
    const classificationResponse = await fetch(
      'https://api-inference.huggingface.co/models/hamzab/roberta-fake-news-classification',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: newsText,
        }),
      }
    );

    if (!classificationResponse.ok) {
      const errorText = await classificationResponse.text();
      console.error('HF Classification error:', errorText);
      throw new Error(`Hugging Face API error: ${errorText}`);
    }

    const classificationData = await classificationResponse.json();
    console.log('Classification result:', classificationData);
    
    // Parse the classification result
    let label = 'UNKNOWN';
    let score = 0;
    
    if (Array.isArray(classificationData) && classificationData[0]) {
      const topResult = classificationData[0][0];
      label = topResult.label;
      score = topResult.score;
    }

    // Map labels to FAKE/REAL
    const labelMap: Record<string, string> = {
      'FAKE': 'FAKE',
      'REAL': 'REAL',
      'LABEL_1': 'FAKE',
      'LABEL_0': 'REAL'
    };
    
    const mappedLabel = labelMap[label] || label;
    
    // Step 2: Generate explanation using Groq API if news is FAKE
    let explanation = '';
    
    if (mappedLabel === 'FAKE') {
      const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
      
      if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
      }

      console.log('Generating explanation with Groq...');
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: `The following news article has been classified as FAKE. Explain in 2-3 sentences why this might be fake news:\n\n${newsText}\n\nExplanation:`,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.error('Groq API error:', errorText);
        explanation = 'Unable to generate explanation at this time.';
      } else {
        const groqData = await groqResponse.json();
        explanation = groqData.choices[0]?.message?.content?.trim() || 'No explanation available.';
        console.log('Generated explanation:', explanation);
      }
    }

    // Step 3: Save to Supabase database
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error: dbError } = await supabaseClient
      .from('detections')
      .insert({
        user_id: user.id,
        news_text: newsText,
        label: mappedLabel,
        score: score,
        explanation: explanation || null,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        label: mappedLabel,
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
