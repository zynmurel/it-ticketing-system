"use client";

import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-8 w-14 shrink-0 rounded-full bg-muted"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted p-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.15 }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300/25 via-transparent to-violet-500/20"
        animate={{ opacity: isDark ? 1 : 0.4 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      <motion.span
        layout={!reduceMotion}
        className="relative z-10 flex size-6 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/60"
        animate={reduceMotion ? undefined : { x: isDark ? 24 : 0 }}
        transition={reduceMotion ? { duration: 0 } : springSnappy}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "sun" : "moon"}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, rotate: -70, scale: 0.55 }
            }
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, rotate: 70, scale: 0.55 }
            }
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="size-3.5 text-amber-500" />
            ) : (
              <Moon className="size-3.5 text-violet-500" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </motion.button>
  );
}
