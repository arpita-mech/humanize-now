import { useState, useCallback } from "react";
import { toast } from "sonner";

const HUMANIZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/humanize`;

interface UseHumanizeOptions {
  tone: string;
}

async function streamResponse(
  resp: Response,
  onChunk: (text: string) => void
): Promise<string> {
  if (!resp.body) throw new Error("No response body");
  const reader = resp.body.getReader();
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
        if (content) {
          result += content;
          onChunk(result);
        }
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  return result;
}

export function useHumanize({ tone }: UseHumanizeOptions) {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");

  const doRequest = useCallback(
    async (text: string, deep: boolean) => {
      if (!text.trim()) {
        toast.error("Please paste some text first.");
        return;
      }

      setIsLoading(true);
      setOutput("");

      try {
        if (deep) {
          // Two-pass: pass 1 is non-streaming on backend, pass 2 streams
          setLoadingLabel("Pass 1 of 2…");
        } else {
          setLoadingLabel("Humanizing…");
        }

        const resp = await fetch(HUMANIZE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, tone, deep }),
        });

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Something went wrong");
        }

        if (deep) {
          setLoadingLabel("Pass 2 of 2…");
        }

        const result = await streamResponse(resp, setOutput);

        if (!result) {
          toast.error("No output received. Please try again.");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to humanize text";
        toast.error(msg);
      } finally {
        setIsLoading(false);
        setLoadingLabel("");
      }
    },
    [tone]
  );

  const humanize = useCallback((text: string) => doRequest(text, false), [doRequest]);
  const deepHumanize = useCallback((text: string) => doRequest(text, true), [doRequest]);
  const clearOutput = useCallback(() => setOutput(""), []);

  return { output, isLoading, loadingLabel, humanize, deepHumanize, clearOutput };
}
