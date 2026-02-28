import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { TextInputPanel } from "@/components/TextInputPanel";
import { TextOutputPanel } from "@/components/TextOutputPanel";
import { ControlsPanel } from "@/components/ControlsPanel";
import { useHumanize } from "@/hooks/useHumanize";
import { AlertTriangle, Lightbulb, ExternalLink } from "lucide-react";

const detectorLinks = [
  { name: "GPTZero", url: "https://gptzero.me" },
  { name: "ZeroGPT", url: "https://www.zerogpt.com" },
  { name: "Copyleaks", url: "https://copyleaks.com/ai-content-detector" },
  { name: "Sapling", url: "https://sapling.ai/ai-content-detector" },
  { name: "Originality.ai", url: "https://originality.ai" },
];

const Index = () => {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("auto");
  const [detector, setDetector] = useState("all");
  const lastModeRef = useRef<"humanize" | "deep" | "copyleaks">("humanize");

  const { output, isLoading, loadingLabel, humanize, deepHumanize, copyleaksMode, clearOutput } = useHumanize({ tone, detector });

  const handleClear = () => {
    setInput("");
    clearOutput();
  };

  const handleHumanize = () => {
    lastModeRef.current = "humanize";
    humanize(input);
  };

  const handleDeepHumanize = () => {
    lastModeRef.current = "deep";
    deepHumanize(input);
  };

  const handleCopyleaks = () => {
    lastModeRef.current = "copyleaks";
    copyleaksMode(input);
  };

  const handleRunAgain = () => {
    if (lastModeRef.current === "deep") {
      deepHumanize(input);
    } else if (lastModeRef.current === "copyleaks") {
      copyleaksMode(input);
    } else {
      humanize(input);
    }
  };

  const tipText = lastModeRef.current === "copyleaks"
    ? "💡 For best results run Copyleaks Mode twice"
    : "💡 Tip: Run through Deep Humanize twice for best results";

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Controls */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 mb-4 shadow-card">
            <ControlsPanel tone={tone} onToneChange={setTone} detector={detector} onDetectorChange={setDetector} />
          </div>

          {/* Editor panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-card">
              <TextInputPanel
                value={input}
                onChange={setInput}
                onHumanize={handleHumanize}
                onDeepHumanize={handleDeepHumanize}
                onCopyleaks={handleCopyleaks}
                onClear={handleClear}
                isLoading={isLoading}
                loadingLabel={loadingLabel}
                detector={detector}
              />
            </div>
            <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-card">
              <TextOutputPanel
                value={output}
                isLoading={isLoading}
                isDeep={lastModeRef.current === "deep"}
                onRunAgain={handleRunAgain}
              />
            </div>
          </div>

          {/* Tip after output */}
          {output && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3"
            >
              <Lightbulb className="h-4 w-4 text-primary shrink-0" />
              <span>{tipText}</span>
            </motion.div>
          )}

          {/* Disclaimer */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Results may vary across AI detectors. Please wait a few seconds between requests.</span>
          </div>

          {/* Detector links */}
          <div className="mt-10 text-center">
            <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-4">
              Test Your Result On These Detectors
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {detectorLinks.map((d) => (
                <a
                  key={d.name}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {d.name}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
