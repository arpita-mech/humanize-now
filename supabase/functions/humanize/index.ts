import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toneInstructions: Record<string, string> = {
  casual: "Use a relaxed, everyday conversational tone. Write like texting a friend — short sentences, slang is okay, keep it breezy.",
  professional: "Use a polished but natural professional tone. Clear, direct, confident — like an experienced colleague writing an email.",
  academic: "Use a scholarly yet readable tone. Incorporate field-appropriate vocabulary, hedging language, and nuanced phrasing typical of academic writing.",
  friendly: "Use a warm, approachable, and encouraging tone. Be personable and engaging, like a helpful mentor.",
};

const levelInstructions: Record<string, string> = {
  mild: "Make minimal changes — just smooth out the most obvious AI patterns while keeping the structure mostly intact.",
  medium: "Moderately rewrite the text — restructure some sentences, vary length, add natural flow while preserving all meaning.",
  strong: "Substantially rewrite the text — completely restructure sentences, add personality, use creative phrasing, make it feel authentically human-written from scratch.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, tone = "professional", level = "medium" } = await req.json();

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

    const systemPrompt = `You are an expert text humanizer. Rewrite the given text to sound 100% human-written. Use natural sentence flow, varied sentence lengths, conversational tone, occasional contractions, natural transitions, and subtle imperfections that humans use. Avoid robotic phrasing, overly formal structure, repetitive patterns, and AI-typical filler phrases like 'certainly', 'absolutely', 'of course', 'I'd be happy to'. Preserve the original meaning and all key information. Output only the rewritten text with no explanations.

${toneInstructions[tone] || toneInstructions.professional}
${levelInstructions[level] || levelInstructions.medium}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a few seconds and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Failed to process text. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("humanize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
