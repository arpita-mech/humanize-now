import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eraser, Wand2, Flame, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface TextInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onHumanize: () => void;
  onDeepHumanize: () => void;
  onCopyleaks: () => void;
  onClear: () => void;
  isLoading: boolean;
  loadingLabel: string;
  detector: string;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function TextInputPanel({ value, onChange, onHumanize, onDeepHumanize, onCopyleaks, onClear, isLoading, loadingLabel, detector }: TextInputPanelProps) {
  const spinner = (
    <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
  );

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

      <div className="flex flex-col gap-2 mt-4">
        <div className="flex gap-2">
          {/* Humanize button */}
          <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onHumanize}
              disabled={isLoading || !value.trim()}
              className="w-full bg-accent text-accent-foreground font-display font-semibold hover:bg-accent/90 transition-opacity h-11"
            >
              {isLoading && loadingLabel === "Humanizing…" ? (
                <span className="flex items-center gap-2">
                  {spinner}
                  {loadingLabel}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Humanize ✨
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

        {/* Deep Humanize button */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onDeepHumanize}
            disabled={isLoading || !value.trim()}
            className="w-full h-11 font-display font-semibold text-primary-foreground"
            style={{
              background: "linear-gradient(135deg, hsl(262 80% 55%), hsl(340 75% 55%))",
            }}
          >
            {isLoading && loadingLabel === "Pass 1 of 2…" || isLoading && loadingLabel === "Pass 2 of 2…" ? (
              <span className="flex items-center gap-2">
                {spinner}
                {loadingLabel}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Deep Humanize 🔥
              </span>
            )}
          </Button>
        </motion.div>

        <div className="flex justify-center">
          <Badge variant="secondary" className="text-[10px] font-normal">
            Best for &lt;10% AI score
          </Badge>
        </div>

        {/* Copyleaks Mode button */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onCopyleaks}
            disabled={isLoading || !value.trim()}
            className="w-full h-11 font-display font-semibold text-primary-foreground"
            style={{
              background: "linear-gradient(135deg, hsl(145 60% 32%), hsl(160 55% 38%))",
            }}
          >
            {isLoading && loadingLabel === "Applying Copyleaks bypass..." ? (
              <span className="flex items-center gap-2">
                {spinner}
                {loadingLabel}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Copyleaks Mode 🛡️
              </span>
            )}
          </Button>
        </motion.div>

        <div className="flex justify-center">
          <Badge variant="secondary" className="text-[10px] font-normal">
            Optimized for Copyleaks detector
          </Badge>
        </div>
      </div>
    </div>
  );
}
