import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COFFEE_URL = "https://buymeacoffee.com/YOUR_USERNAME";
const STORAGE_KEY = "bmc_support_count";
const DISMISSED_KEY = "bmc_dismissed";
const BASE_COUNT = 47;

function getStoredCount(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function BuyMeCoffeeCard({ visible }: { visible: boolean }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [extraCount, setExtraCount] = useState(getStoredCount);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible || dismissed) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(timer);
  }, [visible, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch {}
  };

  const handleClick = () => {
    const next = extraCount + 1;
    setExtraCount(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
    window.open(COFFEE_URL, "_blank", "noopener,noreferrer");
  };

  const totalCount = BASE_COUNT + extraCount;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-full max-w-[500px]"
        >
          <div
            className="relative rounded-2xl p-5 sm:p-6 text-center"
            style={{
              background: "linear-gradient(135deg, #FFF9E6, #FFE8CC)",
              boxShadow: "0 8px 30px rgba(255, 180, 50, 0.15)",
            }}
          >
            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-neutral-500" />
            </button>

            {/* Bouncing coffee */}
            <motion.span
              className="text-3xl inline-block mb-2"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              ☕
            </motion.span>

            <h3 className="font-display font-semibold text-neutral-800 text-base mb-1">
              Liked the result? Support this free tool!
            </h3>
            <p className="text-sm text-neutral-600 mb-4 max-w-xs mx-auto">
              This tool is 100% free and no login required. If it helped you, a small coffee keeps it running!
            </p>

            <Button
              onClick={handleClick}
              className="font-display font-semibold text-sm px-6 h-11 rounded-xl"
              style={{ backgroundColor: "#FFDD00", color: "#000000" }}
            >
              Buy Me a Coffee ☕
            </Button>

            <p className="text-xs text-neutral-500 mt-2">
              Completely optional. No pressure!
            </p>

            <p className="text-xs text-neutral-400 mt-3">
              ❤️ {totalCount} people supported this
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
