import { Button } from "@/components/ui/button";
import { Copy, Check, Lightbulb } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TextOutputPanelProps {
  value: string;
  pass1Preview: string;
  isLoading: boolean;
  showTip: boolean;
  passLabel: string;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function TextOutputPanel({ value, pass1Preview, isLoading, showTip, passLabel }: TextOutputPanelProps) {
  const showingPass1 = pass1Preview && passLabel.includes("Pass 2") && !value;
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
        {showingPass1 ? (
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2">Pass 1 result (being improved...)</p>
            <p className="whitespace-pre-wrap opacity-60">{pass1Preview}</p>
          </div>
        ) : value ? (
          <p className="whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-muted-foreground italic">
            {isLoading ? "Generating humanized text…" : "Your humanized text will appear here."}
          </p>
        )}
      </div>

      {showTip && value && !isLoading && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
          <span>Tip: Run through Deep Humanize twice for best results</span>
        </div>
      )}

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
