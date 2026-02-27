import { useState } from "react";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { TextInputPanel } from "@/components/TextInputPanel";
import { TextOutputPanel } from "@/components/TextOutputPanel";
import { ControlsPanel } from "@/components/ControlsPanel";
import { useHumanize } from "@/hooks/useHumanize";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("professional");
  const [level, setLevel] = useState("medium");

  const { output, isLoading, humanize, clearOutput } = useHumanize({ tone, level });

  const handleClear = () => {
    setInput("");
    clearOutput();
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <main className="container max-w-6xl mx-auto px-4 -mt-8 relative z-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Controls */}
          <div className="glass-card rounded-2xl p-5 mb-4 shadow-card">
            <ControlsPanel
              tone={tone}
              onToneChange={setTone}
              level={level}
              onLevelChange={setLevel}
            />
          </div>

          {/* Editor panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 shadow-card">
              <TextInputPanel
                value={input}
                onChange={setInput}
                onHumanize={() => humanize(input)}
                onClear={handleClear}
                isLoading={isLoading}
              />
            </div>
            <div className="glass-card rounded-2xl p-5 shadow-card">
              <TextOutputPanel value={output} isLoading={isLoading} />
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Results may vary across AI detectors. Please wait a few seconds between requests.</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
