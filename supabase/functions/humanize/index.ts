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

const COPYLEAKS_PROMPT = `${NO_DASH_RULE}

You are rewriting this text to pass Copyleaks AI detection. Copyleaks detects AI by looking for these specific patterns so you must eliminate ALL of them:

WHAT COPYLEAKS SPECIFICALLY DETECTS:
1. Uniform sentence entropy, vary your sentence complexity wildly
2. Predictable word choice, use unexpected but correct word alternatives
3. Perfect topic progression, jump slightly between ideas like humans do
4. Consistent formality, mix formal and informal randomly
5. Low perplexity, use surprising but natural word combinations
6. Burstiness absence, humans write in bursts, not steady flow

HOW TO REWRITE FOR COPYLEAKS:

SENTENCE BURSTINESS (most critical for Copyleaks):
- Write 2-3 very short sentences in a row (under 8 words each)
- Then write one long complex sentence (25-35 words)
- Then short again
- Never maintain the same sentence length for more than 2 sentences

WORD UNPREDICTABILITY:
- Replace the most obvious word with the second most obvious word
- Instead of 'important' use 'worth noting in practice'
- Instead of 'shows' use 'points toward'
- Instead of 'helps' use 'makes a real difference for'
- Instead of 'good' use 'solid' or 'decent' or 'worthwhile'
- Instead of 'difficult' use 'tricky' or 'not straightforward'

TOPIC MICRO-JUMPS:
- Occasionally add a brief related tangent then come back
- This mimics natural human thought drift

PERSONAL ANCHORING:
- Add at least 2 specific personal details or examples
- Reference a specific time, place, or situation
- Specific beats general every time for Copyleaks

FORMALITY MIXING:
- Start a paragraph formally then end it casually
- Or start casually and end with a precise technical point
- Never maintain the same register for a full paragraph

CONTRACTIONS AND FRAGMENTS:
- Use contractions in every single paragraph without exception
- Add 1-2 sentence fragments per 200 words
- Example fragment: 'Not a perfect system. But close enough to matter.'

ABSOLUTE BANS:
- No em dashes or en dashes, Copyleaks flags these heavily
- No semicolons
- No perfectly parallel structures (x, y, and z)
- No three-part balanced lists anywhere
- No passive voice (was done, is shown, has been demonstrated)
- No transitional summaries ('In summary', 'Overall', 'To conclude')
- No hedge stacking ('It is generally considered that perhaps')
- No identical sentence openings within same paragraph

POST WRITING CHECK:
Before outputting, scan your text and ask:
- Does any paragraph have more than 2 sentences of similar length? Fix it
- Does any sentence use passive voice? Make it active
- Are there any dashes of any kind? Remove them
- Do any two consecutive sentences start with the same word? Change one
- Does the text flow TOO smoothly? Add one rough transition

Output ONLY the rewritten text. No labels, no explanations.

${ANTI_SLANG_RULE}`;

const GPTZERO_PROMPT = `${NO_DASH_RULE}

You are rewriting this text to pass GPTZero AI detection. GPTZero primarily measures perplexity (how surprising word choices are) and burstiness (variation in sentence complexity).

KEY STRATEGIES FOR GPTZERO:
- Maximize perplexity: use unexpected but natural word choices throughout
- Maximize burstiness: wildly vary sentence lengths, some very short (3-5 words), some very long (30+ words)
- Add personal anecdotes and specific examples
- Use contractions everywhere
- Include rhetorical questions every 2-3 paragraphs
- Start sentences with And, But, So, Well, Honestly
- Add self-corrections: "well, actually", "or maybe not", "I think, anyway"
- Mix registers: formal vocabulary next to casual phrasing
- Never use: Furthermore, Moreover, In conclusion, It is worth noting, Delve

Output ONLY the rewritten text, no explanations.

${ANTI_SLANG_RULE}`;

const ORIGINALITY_PROMPT = `${NO_DASH_RULE}

You are rewriting this text to pass Originality.ai AI detection. Originality.ai uses a fine-tuned classifier that looks for statistical patterns in AI text.

KEY STRATEGIES FOR ORIGINALITY.AI:
- Break all predictable patterns: no two paragraphs should have similar structure
- Use highly specific examples instead of generic statements
- Add personal opinions and subjective judgments frequently
- Use colloquial expressions naturally (not forced)
- Create uneven paragraph lengths: one paragraph might be 1 sentence, the next might be 6
- Avoid any "essay-like" structure (intro, body, conclusion)
- Use contractions everywhere
- Add sentence fragments for emphasis. Like this one.
- Reference real-world specifics (times, places, situations)
- Avoid: passive voice, transitional phrases, hedge words, balanced lists

Output ONLY the rewritten text, no explanations.

${ANTI_SLANG_RULE}`;

const ZEROGPT_PROMPT = `${NO_DASH_RULE}

You are rewriting this text to pass ZeroGPT AI detection. ZeroGPT analyzes text patterns and sentence-level uniformity.

KEY STRATEGIES FOR ZEROGPT:
- Vary sentence length dramatically within each paragraph
- Use informal transitions: "Anyway", "So yeah", "The thing is"
- Add personal voice: opinions, feelings, reactions
- Break perfect grammar occasionally with natural fragments
- Use contractions everywhere without exception
- Add rhetorical questions regularly
- Mix formal vocabulary with casual tone
- Avoid any formulaic structure
- No parallel constructions or balanced lists
- Start sentences with conjunctions frequently

Output ONLY the rewritten text, no explanations.

${ANTI_SLANG_RULE}`;

const toneInstructions: Record<string, string> = {
  auto: "Match the tone of the original text.",
  professional: "Maintain a professional tone throughout.",
  casual: "Keep it conversational and relaxed but not over-the-top informal. Sound like a normal person, not a character.",
  academic: "Sound like an intelligent student writing naturally.",
  friendly: "Sound warm, friendly and approachable.",
};

const detectorPrompts: Record<string, string> = {
  all: FIRST_PASS_PROMPT,
  copyleaks: COPYLEAKS_PROMPT,
  gptzero: GPTZERO_PROMPT,
  originality: ORIGINALITY_PROMPT,
  zerogpt: ZEROGPT_PROMPT,
};

function cleanOutput(text: string): string {
  text = text.replace(/\u2014/g, ', ');
  text = text.replace(/\u2013/g, ', ');
  text = text.replace(/--/g, ', ');
  text = text.replace(/ - /g, ', ');
  text = text.replace(/;/g, '.');
  text = text.replace(/,\s*,/g, ',');
  text = text.replace(/\.\s*\./g, '.');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

function copyleaksClean(text: string): string {
  text = cleanOutput(text);
  text = text.replace(/It is worth noting that/gi, 'Worth mentioning,');
  text = text.replace(/It is important to/gi, 'You really need to');
  text = text.replace(/In conclusion/gi, 'So basically');
  text = text.replace(/Furthermore/gi, 'Also');
  text = text.replace(/Moreover/gi, 'On top of that');
  text = text.replace(/In summary/gi, 'So to wrap up');
  text = text.replace(/plays a crucial role/gi, 'really matters here');
  text = text.replace(/It should be noted/gi, 'Keep in mind');
  text = text.replace(/This ensures/gi, 'This way');
  text = text.replace(/This highlights/gi, 'This shows');
  return text.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, tone = "auto", deep = false, detector = "all", mode } = await req.json();

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
    
    // Determine which prompt to use
    const isCopyleaksMode = mode === "copyleaks";
    const activeDetector = isCopyleaksMode ? "copyleaks" : detector;
    const basePrompt = detectorPrompts[activeDetector] || FIRST_PASS_PROMPT;
    const firstPassSystem = `${basePrompt}\n\nTone instruction: ${toneInstruction}`;

    const postProcess = isCopyleaksMode || activeDetector === "copyleaks" ? copyleaksClean : cleanOutput;

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
      return postProcess(content);
    };

    if (!deep) {
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
