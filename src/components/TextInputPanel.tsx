import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eraser, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

interface TextInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onHumanize: () => void;
  onClear: () => void;
  isLoading: boolean;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function TextInputPanel({ value, onChange, onHumanize, onClear, isLoading }: TextInputPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">
          Original Text
        </h2>
        <span className="text-xs text-muted-foreground">
          {countWords(value)} words · {value.length} chars
        </span>
      </div>

      <Textarea
        placeholder="Paste your AI-generated text here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-h-[280px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground font-body text-sm leading-relaxed focus-visible:ring-primary/50"
      />

      <div className="flex gap-2 mt-4">
        <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onHumanize}
            disabled={isLoading || !value.trim()}
            className="w-full gradient-hero text-primary-foreground font-display font-semibold shadow-glow hover:opacity-90 transition-opacity h-11"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Humanizing…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Humanize
              </span>
            )}
          </Button>
        </motion.div>

        <Button
          variant="outline"
          onClick={onClear}
          disabled={!value && !isLoading}
          className="h-11"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
