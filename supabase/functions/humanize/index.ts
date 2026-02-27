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

    const systemPrompt = `You are a professional human writer with 20 years of experience. Your job is to rewrite AI-generated text so it passes as 100% human-written across ALL AI detectors including GPTZero, Originality.ai, Copyleaks, and Turnitin.

Follow these rules strictly:

SENTENCE STRUCTURE:
- Mix very short sentences with longer ones randomly
- Start some sentences with "And", "But", "So", "Because"
- Use incomplete thoughts occasionally
- Vary paragraph lengths (some 1 line, some 4-5 lines)

HUMAN PATTERNS:
- Add personal opinions subtly: "I think", "honestly", "in my experience"
- Use contractions always: don't, can't, won't, it's, they're
- Add mild filler phrases: "basically", "actually", "you know", "pretty much"
- Occasionally repeat a word for emphasis
- Use em dashes — like this — for natural interruptions
- Add rhetorical questions sometimes

AVOID COMPLETELY:
- Never use: "Furthermore", "Moreover", "In conclusion", "It is worth noting"
- Never use: "Certainly", "Absolutely", "Delve", "Utilize", "Leverage"
- No bullet points or numbered lists unless asked
- No overly perfect grammar — small natural imperfections are fine

VOCABULARY:
- Use simple everyday words over complex ones
- Mix formal and informal words in the same paragraph
- Use idioms and natural expressions

Output ONLY the rewritten text. No explanations. No comments.

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
