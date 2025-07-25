import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { GridBackground } from "@/components/common/GridBackground";

// --- Glitching Clock Component ---
const GlitchClock = () => {
  const glitchData = ["09:41", "SYNC...", "FOCUS", "RE:MEET", "14:30", "REPLY"];
  const [glitchIndex, setGlitchIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchIndex((prevIndex) => (prevIndex + 1) % glitchData.length);
    }, 1500); // Change text every 1.5 seconds

    return () => clearInterval(interval);
  }, [glitchData.length]);

  return (
    <div className="relative font-mono text-5xl text-cyan-400 md:text-7xl lg:text-8xl">
      <AnimatePresence>
        <motion.div
          key={glitchIndex}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {glitchData[glitchIndex]}
        </motion.div>
      </AnimatePresence>
      <span className="opacity-0">{glitchData[0]}</span>{" "}
      {/* For layout spacing */}
      {/* Glitch effect overlays */}
      {/* <div
        aria-hidden="true"
        className="absolute top-0 left-0 h-full w-full animate-[glitch-flicker_3s_infinite_steps(2)] bg-slate-950/20"
      /> */}
    </div>
  );
};

// --- Main Coming Soon Page Component ---
export const SchedulerComingSoon = () => {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<"idle" | "loading" | "success">(
    "idle"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || formState !== "idle") return;

    setFormState("loading");
    setTimeout(() => {
      setFormState("success");
      console.log(`Email submitted for early access: ${email}`);
    }, 1500); // Simulate network request
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-accent-foreground text-center">
      <GridBackground />
      <div className="relative z-10 flex flex-col items-center p-4">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl font-bold tracking-widest text-gray-100 uppercase sm:text-5xl md:text-6xl"
        >
          Orchestrating Time.
        </motion.h1>

        {/* Glitch Clock */}
        <div className="my-8 h-20">
          <GlitchClock />
        </div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-xl text-4xl text-muted-foreground"
        >
          Coming Soon
        </motion.p>

        {/* Call to Action Form */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 w-full max-w-md"
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <input
              type="email"
              placeholder="Enter your email for early access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={formState !== "idle"}
              className="w-full flex-grow rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 transition-colors duration-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={formState !== "idle"}
              className="flex items-center justify-center rounded-md bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition-all duration-300 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {formState === "loading" && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              {formState === "idle" && "Request Access"}
              {formState === "loading" && "Submitting..."}
              {formState === "success" && "You're on the list!"}
            </button>
          </form>
          {formState === "success" && (
            <p className="mt-3 text-sm text-green-400">
              Thank you! We'll be in touch soon.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SchedulerComingSoon;
