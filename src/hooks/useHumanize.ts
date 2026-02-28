import { useState, useCallback } from "react";
import { toast } from "sonner";

const HUMANIZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/humanize`;

interface UseHumanizeOptions {
  tone: string;
  detector: string;
}

export function useHumanize({ tone, detector }: UseHumanizeOptions) {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");

  const doRequest = useCallback(
    async (text: string, deep: boolean, mode?: string) => {
      if (!text.trim()) {
        toast.error("Please paste some text first.");
        return;
      }

      setIsLoading(true);
      setOutput("");

      if (mode === "copyleaks") {
        setLoadingLabel("Applying Copyleaks bypass...");
      } else if (deep) {
        setLoadingLabel("Pass 1 of 2…");
      } else {
        setLoadingLabel("Humanizing…");
      }

      try {
        const resp = await fetch(HUMANIZE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, tone, deep, detector, mode }),
        });

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Something went wrong");
        }

        if (deep && mode !== "copyleaks") {
          setLoadingLabel("Pass 2 of 2…");
        }

        const data = await resp.json();
        if (data.result) {
          setOutput(data.result);
        } else {
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
    [tone, detector]
  );

  const humanize = useCallback((text: string) => doRequest(text, false), [doRequest]);
  const deepHumanize = useCallback((text: string) => doRequest(text, true), [doRequest]);
  const copyleaksMode = useCallback((text: string) => doRequest(text, false, "copyleaks"), [doRequest]);
  const clearOutput = useCallback(() => setOutput(""), []);

  return { output, isLoading, loadingLabel, humanize, deepHumanize, copyleaksMode, clearOutput };
}
