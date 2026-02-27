import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
      {/* Decorative blurred orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="relative container max-w-4xl mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground mb-6">
            <Sparkles className="h-4 w-4" />
            No Login Required • Free • Instant
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-4">
            100% Human-Sounding
            <br />
            Text, Instantly
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Transform AI-generated text into natural, human-written content that
            passes any detector. Powered by advanced AI rewriting.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
