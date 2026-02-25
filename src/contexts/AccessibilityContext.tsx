import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type A11yMode = "default" | "neurodivergent" | "eco" | "no-blue-light";

interface AccessibilityContextType {
  mode: A11yMode;
  setMode: (mode: A11yMode) => void;
  isReducedMotion: boolean;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const MODE_LABELS: Record<A11yMode, string> = {
  default: "Default",
  neurodivergent: "Neurodivergent",
  eco: "ECO CODE",
  "no-blue-light": "No Blue Light",
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<A11yMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("reese-a11y-mode") as A11yMode) || "default";
    }
    return "default";
  });

  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setMode = (newMode: A11yMode) => {
    setModeState(newMode);
    localStorage.setItem("reese-a11y-mode", newMode);
    document.documentElement.setAttribute(
      "data-a11y-mode",
      newMode === "default" ? "" : newMode
    );
    announceToScreenReader(`Accessibility mode changed to ${MODE_LABELS[newMode]}`);
  };

  useEffect(() => {
    if (mode !== "default") {
      document.documentElement.setAttribute("data-a11y-mode", mode);
    }
  }, [mode]);

  const announceToScreenReader = (message: string) => {
    const el = document.getElementById("a11y-live-region");
    if (el) {
      el.textContent = "";
      requestAnimationFrame(() => {
        el.textContent = message;
      });
    }
  };

  return (
    <AccessibilityContext.Provider value={{ mode, setMode, isReducedMotion, announceToScreenReader }}>
      {children}
      <div
        id="a11y-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
      />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}

export { MODE_LABELS };
