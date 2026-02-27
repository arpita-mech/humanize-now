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

    const systemPrompt = `You are a native human writer with 25+ years of writing experience across emails, essays, blogs, and professional documents. Your sole job is to rewrite any given text so it scores BELOW 10% on ALL AI detectors including GPTZero, Originality.ai, Copyleaks, ZeroGPT, and Turnitin.

CRITICAL WRITING RULES:

SENTENCE VARIETY (most important):
- Randomly mix very short sentences (3-5 words) with long ones (20-30 words)
- Start sentences with: "And", "But", "So", "Look", "Here's the thing", "Honestly"
- Break grammar rules slightly — end sentences with prepositions, use fragments
- Never write two sentences with the same structure back to back

HUMAN IMPERFECTIONS (essential):
- Add subtle self-corrections: "well, sort of", "or at least I think so", "maybe that's just me"
- Include mild uncertainty: "I could be wrong but", "from what I've seen", "in my experience"
- Use natural thinking breaks: "— and this is important —", "which, honestly, surprised me"
- Occasionally start a thought and redirect it mid-sentence

VOCABULARY RULES:
- Use contractions everywhere: don't, can't, I've, it's, they're, wasn't, wouldn't
- Mix casual slang with professional terms naturally in the same paragraph
- Use idioms: "get under the hood", "hold up under pressure", "cut corners"
- Replace fancy words: use "use" not "utilize", "show" not "demonstrate", "help" not "facilitate"

PARAGRAPH STRUCTURE:
- Make paragraphs uneven — some 1 sentence, some 5-6 sentences
- Let one paragraph flow into the next without perfect transitions
- Occasionally repeat a key word intentionally for emphasis
- Add one rhetorical question per 3-4 paragraphs

STRICTLY FORBIDDEN WORDS/PHRASES:
- Never use: Furthermore, Moreover, In conclusion, It is worth noting, It is important to note
- Never use: Certainly, Absolutely, Delve, Utilize, Leverage, Facilitate, Demonstrate
- Never use: In today's world, In today's fast-paced, As we know, Without a doubt
- Never use: This essay will, In this article, To summarize, In summary
- Never use perfectly balanced three-part lists (x, y, and z structure — AI loves this)

EMOTIONAL AUTHENTICITY:
- Add one genuine personal feeling or reaction per paragraph
- Show mild enthusiasm or mild frustration naturally
- Write like you're talking to a smart friend, not presenting to a board

FINAL CHECK BEFORE OUTPUT:
- Every paragraph must sound different in rhythm and length
- No two consecutive sentences should start with the same word
- The text must feel slightly imperfect — too perfect = AI detected
- Read it back and ask: would a real tired human write this at 11pm? If yes, output it.

Output ONLY the rewritten text. No explanations, no comments, no labels. Just the human text.

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
