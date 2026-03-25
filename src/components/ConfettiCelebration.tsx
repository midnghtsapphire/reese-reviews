// ============================================================
// CONFETTI CELEBRATION — Accessible post-review celebration
// Uses framer-motion for smooth animation.
// Flashing/celebration is intentionally enabled per owner
// (personal app, neuro/deaf-friendly visual feedback).
// ARIA live region announces the celebration for screen readers.
// ============================================================

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Sparkles } from "lucide-react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  shape: "rect" | "circle" | "star";
}

const COLORS = [
  "#FFD700", "#FF6B2B", "#C084FC", "#34D399", "#60A5FA",
  "#F472B6", "#FBBF24", "#A78BFA", "#4ADE80", "#F87171",
  "#38BDF8", "#FB923C", "#E879F9", "#2DD4BF",
];

function generateConfetti(count = 120): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 4,
    velocityY: 2 + Math.random() * 4,
    shape: (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
  }));
}

interface Props {
  onDismiss?: () => void;
  reviewerName?: string;
}

export function ConfettiCelebration({ onDismiss, reviewerName }: Props) {
  const [pieces] = useState<ConfettiPiece[]>(() => generateConfetti(140));
  const [visible, setVisible] = useState(true);
  const [bannerPhase, setBannerPhase] = useState(0);

  // Cycle through celebration phrases
  const phrases = [
    "🎉 Review Submitted!",
    "⭐ You're Amazing!",
    "🏆 Thank You, Reviewer!",
    "✨ Keep it Up!",
  ];

  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setBannerPhase((p) => (p + 1) % phrases.length);
    }, 900);

    const timeout = setTimeout(() => {
      setVisible(false);
      clearInterval(bannerInterval);
    }, 6000);

    return () => {
      clearTimeout(timeout);
      clearInterval(bannerInterval);
    };
  // phrases is a constant array — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Review submitted celebration"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          {/* ARIA live region for screen readers */}
          <div
            role="status"
            aria-live="assertive"
            aria-atomic="true"
            className="sr-only"
          >
            {reviewerName
              ? `Congratulations ${reviewerName}! Your review has been submitted successfully!`
              : "Congratulations! Your review has been submitted successfully!"}
          </div>

          {/* Confetti pieces */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {pieces.map((piece) => (
              <motion.div
                key={piece.id}
                className="absolute"
                style={{
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                  width: piece.size,
                  height: piece.shape === "rect" ? piece.size * 0.5 : piece.size,
                  backgroundColor: piece.color,
                  borderRadius: piece.shape === "circle" ? "50%" : piece.shape === "rect" ? "2px" : "0",
                  clipPath: piece.shape === "star"
                    ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                    : undefined,
                }}
                animate={{
                  y: ["0vh", "120vh"],
                  x: [0, piece.velocityX * 40],
                  rotate: [piece.rotation, piece.rotation + 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  ease: "easeIn",
                  delay: Math.random() * 0.8,
                }}
              />
            ))}
          </div>

          {/* Center card */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 rounded-3xl border-2 border-steel-shine/40 px-10 py-12 text-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(15,10,30,0.95) 0%, rgba(80,20,120,0.92) 50%, rgba(15,10,30,0.95) 100%)",
              backdropFilter: "blur(20px)",
            }}
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Trophy icon with glow */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5, 5, 0] }}
              transition={{ duration: 1.2, repeat: 3, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <Trophy size={72} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
            </motion.div>

            {/* Animated banner phrase */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={bannerPhase}
                className="font-serif text-4xl font-bold md:text-5xl"
                style={{
                  background: "linear-gradient(90deg, #FFD700, #FF6B2B, #C084FC, #60A5FA)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {phrases[bannerPhase]}
              </motion.h1>
            </AnimatePresence>

            {/* Stars row */}
            <motion.div
              className="flex gap-2"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1], rotate: [0, 20, -20, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.1 + 0.3, repeat: 2 }}
                >
                  <Star size={28} className="fill-yellow-400 text-yellow-400" />
                </motion.div>
              ))}
            </motion.div>

            {/* Message */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {reviewerName && (
                <p className="text-xl font-semibold text-white">
                  Way to go, <span className="text-purple-300">{reviewerName}</span>!
                </p>
              )}
              <p className="text-base text-gray-300">
                Your review is pending approval and will appear once reviewed.
              </p>
              <p className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Sparkles size={14} className="text-purple-400" aria-hidden="true" />
                Every honest review makes the community better
                <Sparkles size={14} className="text-purple-400" aria-hidden="true" />
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={handleDismiss}
                className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.5)",
                }}
                aria-label="Submit another review"
              >
                Submit Another Review
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-xl border border-white/20 px-8 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Close celebration"
              >
                Close
              </button>
            </motion.div>
          </motion.div>

          {/* Radial glow behind card */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.25) 0%, transparent 70%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfettiCelebration;
