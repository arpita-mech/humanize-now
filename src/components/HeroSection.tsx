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

          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground leading-tight mb-4">
            A Curious Brain &{" "}
            <em className="italic font-bold">Confused Nerves</em>
            <br />
            <span className="relative inline-block">
              Finding Solutions to Its Own Problems
              {/* Animated wavy underline */}
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                height="8"
                viewBox="0 0 400 8"
                preserveAspectRatio="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
              >
                <motion.path
                  d="M0,4 Q10,0 20,4 Q30,8 40,4 Q50,0 60,4 Q70,8 80,4 Q90,0 100,4 Q110,8 120,4 Q130,0 140,4 Q150,8 160,4 Q170,0 180,4 Q190,8 200,4 Q210,0 220,4 Q230,8 240,4 Q250,0 260,4 Q270,8 280,4 Q290,0 300,4 Q310,8 320,4 Q330,0 340,4 Q350,8 360,4 Q370,0 380,4 Q390,8 400,4"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                />
              </motion.svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Because if AI wrote it, a human should own it.
            <br />
            Paste your text. Get your voice back.
          </p>

          <motion.p
            className="mt-4 text-sm text-primary-foreground/50 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            — built by curiosity, powered by caffeine ☕
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
