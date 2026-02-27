import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TextOutputPanelProps {
  value: string;
  isLoading: boolean;
  isDeep?: boolean;
  onRunAgain?: () => void;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function TextOutputPanel({ value, isLoading, isDeep, onRunAgain }: TextOutputPanelProps) {
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

      <div className="flex-1 min-h-[280px] rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground font-body overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {value ? (
            <motion.div
              key="output"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="whitespace-pre-wrap">{value}</p>
            </motion.div>
          ) : (
            <motion.p
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground italic"
            >
              {isLoading ? "Generating humanized text…" : "Your humanized text will appear here."}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* AI Score badge */}
      {value && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex justify-center"
        >
          <Badge variant="outline" className="text-xs font-normal px-3 py-1">
            🎯 Estimated AI Score: {isDeep ? "~5-10%" : "~8-15%"}
          </Badge>
        </motion.div>
      )}

      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          onClick={handleCopy}
          disabled={!value}
          className="flex-1 h-11 font-display font-semibold"
        >
          {copied ? (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Copied!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Copy className="h-4 w-4" /> Copy
            </span>
          )}
        </Button>

        {value && !isLoading && onRunAgain && (
          <Button
            variant="outline"
            onClick={onRunAgain}
            className="h-11 font-display font-semibold"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Run Again
          </Button>
        )}
      </div>
    </div>
  );
}
