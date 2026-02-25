import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility, Brain, Leaf, Sun, X, Check } from "lucide-react";
import { useAccessibility, MODE_LABELS, type A11yMode } from "@/contexts/AccessibilityContext";

const modes: { value: A11yMode; icon: typeof Brain; label: string; description: string }[] = [
  {
    value: "default",
    icon: Check,
    label: "Default",
    description: "Standard experience with all animations and effects",
  },
  {
    value: "neurodivergent",
    icon: Brain,
    label: "Neurodivergent",
    description: "No animations, high-legibility font, increased spacing, enhanced focus indicators",
  },
  {
    value: "eco",
    icon: Leaf,
    label: "ECO CODE",
    description: "Minimal power usage — no animations, shadows, or blur effects",
  },
  {
    value: "no-blue-light",
    icon: Sun,
    label: "No Blue Light",
    description: "Warm amber/sepia palette to reduce eye strain and improve sleep",
  },
];

export default function AccessibilityToggle() {
  const { mode, setMode } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Accessibility settings. Current mode: ${MODE_LABELS[mode]}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Accessibility size={18} />
        {mode !== "default" && (
          <span className="hidden text-xs font-medium text-steel-shine sm:inline">
            {MODE_LABELS[mode]}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl glass-card-strong p-4"
              role="dialog"
              aria-label="Accessibility modes"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Accessibility Mode
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Close accessibility panel"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Choose a display mode that works best for you. Your preference is saved automatically.
              </p>
              <div className="space-y-2">
                {modes.map(({ value, icon: Icon, label, description }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setMode(value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                      mode === value
                        ? "bg-accent/60 ring-1 ring-steel-shine/30"
                        : "hover:bg-accent/30"
                    }`}
                    aria-pressed={mode === value}
                    role="radio"
                    aria-checked={mode === value}
                  >
                    <Icon
                      size={18}
                      className={`mt-0.5 shrink-0 ${
                        mode === value ? "text-steel-shine" : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <span
                        className={`block text-sm font-medium ${
                          mode === value ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {label}
                      </span>
                      <span className="block text-xs text-muted-foreground/70">
                        {description}
                      </span>
                    </div>
                    {mode === value && (
                      <Check size={16} className="ml-auto mt-0.5 shrink-0 text-steel-shine" />
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground/50 text-center">
                Built with care for Reese and the deaf/neurodivergent community
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
