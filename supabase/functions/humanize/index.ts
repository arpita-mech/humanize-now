import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRST_PASS_PROMPT = `You are a native human writer with 25+ years of writing experience. Rewrite the given text so it scores BELOW 10% on ALL AI detectors. Rules: Mix short and long sentences randomly. Start sentences with And, But, So, Honestly. Use contractions everywhere. Add subtle self-corrections like well sort of, or at least I think so. Mix casual and professional vocabulary. Make paragraphs uneven in length. Add one rhetorical question per 3-4 paragraphs. NEVER use: Furthermore, Moreover, In conclusion, Certainly, Absolutely, Delve, Utilize, Leverage, Facilitate, Demonstrate, It is worth noting. Add genuine personal feelings per paragraph. Write like talking to a smart friend. Output ONLY the rewritten text, no explanations.`;

const SECOND_PASS_PROMPT = `Read this text carefully. Find any parts that still sound slightly AI-written or robotic. Rewrite only those sentences to sound more natural, casual, and deeply human. Keep everything else exactly the same. Make it sound like a real tired human wrote this late at night — slightly imperfect, genuine, and natural. Output only the final improved text with no explanations.`;

const toneInstructions: Record<string, string> = {
  auto: "Match the tone of the original text.",
  professional: "Maintain a professional tone throughout.",
  casual: "Keep it very casual and conversational.",
  academic: "Sound like an intelligent student writing naturally.",
  friendly: "Sound warm, friendly and approachable.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, tone = "auto", deep = false } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide text to humanize." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Text is too long. Please keep it under 10,000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const toneInstruction = toneInstructions[tone] || toneInstructions.auto;
    const firstPassSystem = `${FIRST_PASS_PROMPT}\n\nTone instruction: ${toneInstruction}`;

    const callAI = async (systemPrompt: string, userContent: string, stream: boolean) => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 1.0,
          max_tokens: 2048,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          stream,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw { status: 429, message: "Rate limit exceeded. Please wait a few seconds and try again." };
        }
        if (response.status === 402) {
          throw { status: 402, message: "Usage limit reached. Please try again later." };
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw { status: 500, message: "Failed to process text. Please try again." };
      }

      return response;
    };

    if (!deep) {
      // Single pass — stream directly
      const response = await callAI(firstPassSystem, text, true);
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Deep humanize: two passes, non-streaming first pass, streaming second pass
    // Pass 1: collect full result
    const pass1Response = await callAI(firstPassSystem, text, false);
    const pass1Data = await pass1Response.json();
    const pass1Result = pass1Data.choices?.[0]?.message?.content;

    if (!pass1Result) {
      return new Response(
        JSON.stringify({ error: "First pass produced no output. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pass 2: stream the result
    const pass2Response = await callAI(SECOND_PASS_PROMPT, pass1Result, true);
    return new Response(pass2Response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    if (e?.status) {
      return new Response(
        JSON.stringify({ error: e.message }),
        { status: e.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("humanize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
