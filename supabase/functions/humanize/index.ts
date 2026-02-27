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

const FIRST_PASS_PROMPT = `You are a real human being writing casually. You have emotions, opinions, and you make small mistakes sometimes. Rewrite the text below as if you personally lived this experience and you're telling a friend about it over coffee.

Rules you must follow without exception:

1. Write the way people actually talk, not how they write in textbooks
2. Use short sentences. Really short sometimes. Like this.
3. Use contractions always, don't, can't, I've, won't, wasn't, it's
4. Add personal reactions, 'that hit different', 'not gonna lie', 'which was kind of unexpected', 'and yeah, it worked'
5. Make some paragraphs just one sentence long
6. Make some paragraphs 4-5 sentences with no perfect structure
7. Never use comma then a fancy connecting word, just start a new sentence
8. Add small admissions of doubt, 'I think', 'probably', 'more or less', 'if I'm being honest', 'at least in my case'
9. Randomly vary where you put the main point of a sentence, sometimes front, sometimes buried in the middle
10. Read each sentence back, if it sounds like a robot wrote it, rewrite it

BANNED FOREVER:
em dashes, en dashes, semicolons, Furthermore, Moreover, In conclusion, It is worth noting, Certainly, Absolutely, Delve, Utilize, Leverage, Facilitate, Demonstrate, In today's world, Without a doubt, This highlights, This ensures, It is important, plays a crucial role, perfectly balanced three part lists

Output only the rewritten text. Nothing else.`;

const SECOND_PASS_PROMPT = `You are editing a piece of writing to make it sound less robotic. Read through the text and do the following:

- Find any sentence that sounds too clean or too structured, break it up
- Find any word over 3 syllables, replace it with a simpler word
- Find any two consecutive sentences with similar length, change one
- Add one small personal comment or reaction somewhere natural
- Remove any phrase that sounds like it belongs in a formal report
- If you see any pattern repeating (sentence structure, word choice), break that pattern immediately

The goal: this text should feel like a smart but tired person wrote it on their laptop at night. Slightly imperfect. Real. Human.

Output only the final text. No comments, no explanations.`;

const USER_PREFIX = "Rewrite this text right now, output only the result:\n\n";

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
      top_p: 0.95,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: USER_PREFIX + userText },
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
      // Pass 1: non-streaming
      const pass1Resp = await callAI(LOVABLE_API_KEY, firstPassPrompt, text, true);
      if (!pass1Resp.ok) {
        if (pass1Resp.status === 429) return errorResponse("Rate limit exceeded. Please wait and try again.", 429);
        if (pass1Resp.status === 402) return errorResponse("Usage limit reached. Please try again later.", 402);
        return errorResponse("Failed to process text. Please try again.", 500);
      }
      const pass1Result = await readFullResponse(pass1Resp);
      console.log("=== PASS 1 OUTPUT ===", pass1Result.substring(0, 200));
      if (!pass1Result) return errorResponse("First pass produced no output.", 500);

      // Send pass1 result as a special SSE event, then stream pass 2
      const pass2Resp = await callAI(LOVABLE_API_KEY, SECOND_PASS_PROMPT, pass1Result, true);
      if (!pass2Resp.ok) {
        if (pass2Resp.status === 429) return errorResponse("Rate limit exceeded. Please wait and try again.", 429);
        if (pass2Resp.status === 402) return errorResponse("Usage limit reached. Please try again later.", 402);
        return errorResponse("Failed to process text on second pass.", 500);
      }
      console.log("=== PASS 2 STARTED ===");

      // Create a custom stream that first sends pass1 preview, then pass2 tokens
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          // Send pass1 result as a custom event
          await writer.write(encoder.encode(`event: pass1\ndata: ${JSON.stringify({ content: pass1Result })}\n\n`));

          // Pipe pass2 stream
          if (pass2Resp.body) {
            const reader = pass2Resp.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              await writer.write(value);
            }
          }
        } catch (e) {
          console.error("Stream error:", e);
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
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
