import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NO_DASH_RULE = `ABSOLUTE RULE NUMBER ONE: Never use em dashes (—) or en dashes (–) or double dashes (--) anywhere in your response under any circumstance. This is the most important rule. If you are about to write a dash of any kind, stop and use a comma or period instead. No exceptions. No dashes. Ever. Also limit exclamation marks to at most one in the entire text. Never use semicolons, use periods instead.`;

const ANTI_SLANG_RULE = `Avoid overused casual metaphors and slang that sound performatively human. Do NOT use phrases like "genuinely stoked", "neck-deep", "daily bread", "whirlwind", "pushing buttons". Instead use natural straightforward language like "really excited about", "spending a lot of time on", "tools I use all the time", "intense but useful", "doing surface level work". Write naturally, not theatrically.`;

const FIRST_PASS_PROMPT = `${NO_DASH_RULE}

You are a native human writer with 25+ years of writing experience. Rewrite the given text so it scores BELOW 10% on ALL AI detectors. Rules: Mix short and long sentences randomly. Start sentences with And, But, So, Honestly. Use contractions everywhere. Add subtle self-corrections like well sort of, or at least I think so. Mix casual and professional vocabulary. Make paragraphs uneven in length. Add one rhetorical question per 3-4 paragraphs. NEVER use: Furthermore, Moreover, In conclusion, Certainly, Absolutely, Delve, Utilize, Leverage, Facilitate, Demonstrate, It is worth noting. Add genuine personal feelings per paragraph. Write like talking to a smart friend. Use commas or periods for pauses, NEVER dashes of any kind. Output ONLY the rewritten text, no explanations.

${ANTI_SLANG_RULE}`;

const SECOND_PASS_PROMPT = `${NO_DASH_RULE}

Read this text carefully. Find any parts that still sound slightly AI-written or robotic. Rewrite only those sentences to sound more natural, casual, and deeply human. Keep everything else exactly the same. Make it sound like a real tired human wrote this late at night, slightly imperfect, genuine, and natural. Remember: absolutely no dashes of any kind, use commas or periods instead. Output only the final improved text with no explanations.

${ANTI_SLANG_RULE}`;

const toneInstructions: Record<string, string> = {
  auto: "Match the tone of the original text.",
  professional: "Maintain a professional tone throughout.",
  casual: "Keep it conversational and relaxed but not over-the-top informal. Sound like a normal person, not a character.",
  academic: "Sound like an intelligent student writing naturally.",
  friendly: "Sound warm, friendly and approachable.",
};

function cleanOutput(text: string): string {
  // Remove all types of dashes
  text = text.replace(/\u2014/g, ', ');  // em dash —
  text = text.replace(/\u2013/g, ', ');  // en dash –
  text = text.replace(/--/g, ', ');       // double dash --
  text = text.replace(/ - /g, ', ');      // spaced single dash

  // Remove semicolons
  text = text.replace(/;/g, '.');

  // Fix double spaces or double commas created by replacements
  text = text.replace(/,\s*,/g, ',');
  text = text.replace(/\.\s*\./g, '.');
  text = text.replace(/\s+/g, ' ');

  return text.trim();
}

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

    const callAI = async (systemPrompt: string, userContent: string) => {
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
          stream: false,
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

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw { status: 500, message: "No output received. Please try again." };
      return cleanOutput(content);
    };

    if (!deep) {
      // Single pass, non-streaming so we can clean the output
      const result = await callAI(firstPassSystem, text);
      return new Response(
        JSON.stringify({ result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deep humanize: two passes
    const pass1Result = await callAI(firstPassSystem, text);
    const pass2Result = await callAI(SECOND_PASS_PROMPT, pass1Result);

    return new Response(
      JSON.stringify({ result: pass2Result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
