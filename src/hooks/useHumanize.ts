import { useState, useCallback } from "react";
import { toast } from "sonner";

const HUMANIZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/humanize`;

interface UseHumanizeOptions {
  tone: string;
}

export function useHumanize({ tone }: UseHumanizeOptions) {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  const [passLabel, setPassLabel] = useState("");

  const streamResponse = async (resp: Response): Promise<string> => {
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
            setOutput(result);
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    return result;
  };

  const humanize = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.error("Please paste some text first.");
        return;
      }
      setIsLoading(true);
      setOutput("");
      setPassLabel("");

      try {
        const resp = await fetch(HUMANIZE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, tone, deep: false }),
        });

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Something went wrong");
        }

        const result = await streamResponse(resp);
        if (!result) toast.error("No output received. Please try again.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to humanize text");
      } finally {
        setIsLoading(false);
      }
    },
    [tone]
  );

  const deepHumanize = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.error("Please paste some text first.");
        return;
      }
      setIsDeepLoading(true);
      setOutput("");
      setPassLabel("Pass 1 of 2...");

      try {
        // The edge function handles both passes internally.
        // Pass 1 happens server-side (non-streaming), pass 2 streams back.
        // We show "Pass 1 of 2..." initially, then switch when streaming starts.
        const resp = await fetch(HUMANIZE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, tone, deep: true }),
        });

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Something went wrong");
        }

        setPassLabel("Pass 2 of 2...");
        const result = await streamResponse(resp);
        if (!result) toast.error("No output received. Please try again.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to humanize text");
      } finally {
        setIsDeepLoading(false);
        setPassLabel("");
      }
    },
    [tone]
  );

  const clearOutput = useCallback(() => setOutput(""), []);

  return { output, isLoading, isDeepLoading, passLabel, humanize, deepHumanize, clearOutput };
}
