import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TextOutputPanelProps {
  value: string;
  isLoading: boolean;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function TextOutputPanel({ value, isLoading }: TextOutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">
          Humanized Text
        </h2>
        <span className="text-xs text-muted-foreground">
          {countWords(value)} words · {value.length} chars
        </span>
      </div>

      <div className="flex-1 min-h-[280px] rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground font-body overflow-y-auto">
        {value ? (
          <p className="whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-muted-foreground italic">
            {isLoading ? "Generating humanized text…" : "Your humanized text will appear here."}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Button
          variant="outline"
          onClick={handleCopy}
          disabled={!value}
          className="w-full h-11 font-display font-semibold"
        >
          {copied ? (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Copied!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Copy className="h-4 w-4" /> Copy to Clipboard
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
