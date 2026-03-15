import { useState, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [shake]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Please enter a password");
      setShake(true);
      return;
    }
    const ok = login(password);
    if (!ok) {
      setError("Incorrect password. Try again.");
      setShake(true);
      setPassword("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: "#0d0d0d" }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,43,0.12) 0%, transparent 70%)",
          top: "10%",
          left: "15%",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,179,71,0.10) 0%, transparent 70%)",
          bottom: "10%",
          right: "10%",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(230,57,70,0.08) 0%, transparent 70%)",
          top: "50%",
          right: "30%",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            background:
              i % 3 === 0
                ? "rgba(255,107,43,0.4)"
                : i % 3 === 1
                ? "rgba(255,179,71,0.35)"
                : "rgba(230,57,70,0.3)",
            left: `${10 + i * 11}%`,
            top: `${15 + (i % 4) * 20}%`,
          }}
          animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 4 + i * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
      ))}

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          x: shake ? [0, -10, 10, -8, 8, -4, 4, 0] : 0,
        }}
        transition={
          shake
            ? { duration: 0.5, ease: "easeInOut" }
            : { duration: 0.7, ease: "easeOut" }
        }
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,107,43,0.15) 0%, rgba(230,57,70,0.15) 100%)",
                border: "1px solid rgba(255,107,43,0.2)",
              }}
            >
              <Lock size={28} style={{ color: "#FF6B2B" }} />
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-center font-serif text-3xl font-bold mb-1"
            style={{
              background:
                "linear-gradient(135deg, #FF6B2B 0%, #FFB347 50%, #E63946 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Reese Reviews
          </h1>
          <p
            className="text-center text-sm font-medium tracking-widest uppercase mb-8"
            style={{ color: "rgba(255,179,71,0.6)" }}
          >
            Login
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter password"
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: error
                      ? "1px solid rgba(230,57,70,0.6)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    color: "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(8px)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(255,107,43,0.4)";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(255,107,43,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error
                      ? "rgba(230,57,70,0.6)"
                      : "rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  background: "rgba(230,57,70,0.1)",
                  border: "1px solid rgba(230,57,70,0.2)",
                }}
              >
                <AlertCircle size={14} style={{ color: "#E63946" }} />
                <span className="text-xs font-medium" style={{ color: "#E63946" }}>
                  {error}
                </span>
              </motion.div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full rounded-xl py-3 text-sm font-semibold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, #FF6B2B 0%, #E63946 100%)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(255,107,43,0.25)",
              }}
            >
              Sign In
            </button>
          </form>

          {/* Footer */}
          <p
            className="mt-6 text-center text-xs"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Protected by OpenAudrey
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
