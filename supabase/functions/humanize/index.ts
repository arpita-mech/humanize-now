import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toneInstructions: Record<string, string> = {
  auto: "Match the tone of the original text.",
  casual: "Keep it very casual and conversational.",
  professional: "Maintain a professional tone throughout.",
  academic: "Sound like an intelligent student writing naturally.",
  friendly: "Sound warm, friendly and approachable.",
};

const FIRST_PASS_PROMPT = `You are a native human writer with 25+ years of writing experience. Rewrite the given text so it scores BELOW 10% on ALL AI detectors.

Rules:
- Mix short and long sentences randomly. Start sentences with And, But, So, Honestly.
- Use contractions everywhere. Add subtle self-corrections like "well sort of", "or at least I think so".
- Mix casual and professional vocabulary. Make paragraphs uneven in length.
- Add one rhetorical question per 3-4 paragraphs.
- Add genuine personal feelings per paragraph. Write like talking to a smart friend.

PUNCTUATION RULES (very important):
- NEVER use em dashes or en dashes anywhere in the text. Not a single one.
- NEVER use double dashes (--) either.
- Instead of dashes, use commas, periods, or just start a new sentence.
- NEVER use semicolons. AI loves perfectly placed semicolons so avoid them completely.
- Limit exclamation marks to maximum 1 per the entire text.
- Use parentheses occasionally for side thoughts (like this) instead of dashes.

REPLACE THESE AI PATTERNS:
- Instead of long em-dash interruptions, just write the thought naturally with commas or as a new sentence.
- Instead of long flowing connected sentences, just. Stop. And start fresh.
- No perfectly parallel sentence structures.

STRICTLY FORBIDDEN (never use any of these):
- Furthermore, Moreover, In conclusion, Certainly, Absolutely, Delve, Utilize, Leverage, Facilitate, Demonstrate, It is worth noting, It is important to note
- In today's world, In today's fast-paced, As we know, Without a doubt
- Em dashes, en dashes, semicolons, perfectly balanced three-part lists

Output ONLY the rewritten text, no explanations.`;

const SECOND_PASS_PROMPT = `Read this text carefully. Find any parts that still sound slightly AI-written or robotic. Rewrite only those sentences to sound more natural, casual, and deeply human. Keep everything else exactly the same. Make it sound like a real tired human wrote this late at night, slightly imperfect, genuine, and natural. IMPORTANT: Remove ALL em dashes, en dashes, double dashes, and semicolons. Replace them with commas, periods, or new sentences. Output only the final improved text with no explanations.`;

async function callAI(apiKey: string, systemPrompt: string, userText: string, stream: boolean) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      temperature: 1.0,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      stream,
    }),
  });
  return response;
}

async function readFullResponse(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) result += content;
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  return result;
}

function errorResponse(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, tone = "auto", deep = false } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return errorResponse("Please provide text to humanize.", 400);
    }
    if (text.length > 10000) {
      return errorResponse("Text is too long. Please keep it under 10,000 characters.", 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const toneInstruction = toneInstructions[tone] || toneInstructions.auto;
    const firstPassPrompt = `${FIRST_PASS_PROMPT}\n\nTone instruction: ${toneInstruction}`;

    if (deep) {
      // Two-pass: first pass non-streaming, second pass streaming
      const pass1Resp = await callAI(LOVABLE_API_KEY, firstPassPrompt, text, true);
      if (!pass1Resp.ok) {
        if (pass1Resp.status === 429) return errorResponse("Rate limit exceeded. Please wait and try again.", 429);
        if (pass1Resp.status === 402) return errorResponse("Usage limit reached. Please try again later.", 402);
        return errorResponse("Failed to process text. Please try again.", 500);
      }
      const pass1Result = await readFullResponse(pass1Resp);
      if (!pass1Result) return errorResponse("First pass produced no output.", 500);

      // Second pass - stream the response
      const pass2Resp = await callAI(LOVABLE_API_KEY, SECOND_PASS_PROMPT, pass1Result, true);
      if (!pass2Resp.ok) {
        if (pass2Resp.status === 429) return errorResponse("Rate limit exceeded. Please wait and try again.", 429);
        if (pass2Resp.status === 402) return errorResponse("Usage limit reached. Please try again later.", 402);
        return errorResponse("Failed to process text on second pass.", 500);
      }

      return new Response(pass2Resp.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      // Single pass - stream directly
      const response = await callAI(LOVABLE_API_KEY, firstPassPrompt, text, true);
      if (!response.ok) {
        if (response.status === 429) return errorResponse("Rate limit exceeded. Please wait and try again.", 429);
        if (response.status === 402) return errorResponse("Usage limit reached. Please try again later.", 402);
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return errorResponse("Failed to process text. Please try again.", 500);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }
  } catch (e) {
    console.error("humanize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
