import { useState, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type AuthView = "login" | "signup" | "forgot" | "legacy";

const LoginPage = () => {
  const { login, signIn, signUp, resetPassword } = useAuth();

  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [shake]);

  const clearFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setError("");
    setSuccess("");
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      setShake(true);
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
      setShake(true);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      setShake(true);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setShake(true);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setShake(true);
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password, displayName);
    setLoading(false);
    if (err) {
      setError(err);
      setShake(true);
    } else {
      setSuccess("Account created! Check your email to confirm, then sign in.");
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email");
      setShake(true);
      return;
    }
    setLoading(true);
    const { error: err } = await resetPassword(email);
    setLoading(false);
    if (err) {
      setError(err);
      setShake(true);
    } else {
      setSuccess("Password reset email sent! Check your inbox.");
    }
  };

  const handleLegacyLogin = (e: FormEvent) => {
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

  // ─── Shared UI helpers ────────────────────────────────────

  const inputStyle = (hasError: boolean) => ({
    background: "rgba(255, 255, 255, 0.05)",
    border: hasError
      ? "1px solid rgba(230,57,70,0.6)"
      : "1px solid rgba(255, 255, 255, 0.08)",
    color: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(8px)",
  });

  const renderInput = (
    id: string,
    label: string,
    type: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    autoFocus = false,
    isPassword = false
  ) => (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setError("");
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all"
          style={inputStyle(!!error)}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(255,107,43,0.4)";
            e.target.style.boxShadow = "0 0 0 3px rgba(255,107,43,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error
              ? "rgba(230,57,70,0.6)"
              : "rgba(255,255,255,0.08)";
            e.target.style.boxShadow = "none";
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );

  const renderError = () =>
    error ? (
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
    ) : null;

  const renderSuccess = () =>
    success ? (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        <CheckCircle size={14} style={{ color: "#22c55e" }} />
        <span className="text-xs font-medium" style={{ color: "#22c55e" }}>
          {success}
        </span>
      </motion.div>
    ) : null;

  const submitButton = (text: string) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl py-3 text-sm font-semibold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, #FF6B2B 0%, #E63946 100%)",
        color: "#fff",
        boxShadow: "0 4px 20px rgba(255,107,43,0.25)",
      }}
    >
      {loading ? "Please wait..." : text}
    </button>
  );

  // ─── View renderers ──────────────────────────────────────

  const renderLoginForm = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      {renderInput("login-email", "Email", "email", email, setEmail, "you@example.com", true)}
      {renderInput("login-password", "Password", "password", password, setPassword, "Enter password", false, true)}
      {renderError()}
      {submitButton("Sign In")}
      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={() => { clearFields(); setView("forgot"); }}
          className="text-xs transition-colors hover:underline"
          style={{ color: "rgba(255,179,71,0.7)" }}
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={() => { clearFields(); setView("signup"); }}
          className="text-xs transition-colors hover:underline"
          style={{ color: "rgba(255,179,71,0.7)" }}
        >
          Create account
        </button>
      </div>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2" style={{ background: "rgba(13,13,13,0.95)", color: "rgba(255,255,255,0.3)" }}>
            or
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => { clearFields(); setView("legacy"); }}
        className="w-full rounded-xl py-2.5 text-xs font-medium tracking-wide transition-all hover:scale-[1.01]"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Use access password
      </button>
    </form>
  );

  const renderSignUpForm = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      {renderInput("signup-name", "Display Name (optional)", "text", displayName, setDisplayName, "Your name")}
      {renderInput("signup-email", "Email", "email", email, setEmail, "you@example.com")}
      {renderInput("signup-password", "Password", "password", password, setPassword, "Min 6 characters", false, true)}
      {renderInput("signup-confirm", "Confirm Password", "password", confirmPassword, setConfirmPassword, "Confirm password", false, true)}
      {renderError()}
      {renderSuccess()}
      {submitButton("Create Account")}
      <button
        type="button"
        onClick={() => { clearFields(); setView("login"); }}
        className="flex items-center gap-1 text-xs mx-auto mt-3 transition-colors hover:underline"
        style={{ color: "rgba(255,179,71,0.7)" }}
      >
        <ArrowLeft size={12} /> Back to sign in
      </button>
    </form>
  );

  const renderForgotForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
        Enter your email and we will send a password reset link.
      </p>
      {renderInput("forgot-email", "Email", "email", email, setEmail, "you@example.com", true)}
      {renderError()}
      {renderSuccess()}
      {submitButton("Send Reset Link")}
      <button
        type="button"
        onClick={() => { clearFields(); setView("login"); }}
        className="flex items-center gap-1 text-xs mx-auto mt-3 transition-colors hover:underline"
        style={{ color: "rgba(255,179,71,0.7)" }}
      >
        <ArrowLeft size={12} /> Back to sign in
      </button>
    </form>
  );

  const renderLegacyForm = () => (
    <form onSubmit={handleLegacyLogin} className="space-y-4">
      <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
        Enter the site access password to continue.
      </p>
      {renderInput("legacy-password", "Password", "password", password, setPassword, "Enter access password", true, true)}
      {renderError()}
      {submitButton("Unlock")}
      <button
        type="button"
        onClick={() => { clearFields(); setView("login"); }}
        className="flex items-center gap-1 text-xs mx-auto mt-3 transition-colors hover:underline"
        style={{ color: "rgba(255,179,71,0.7)" }}
      >
        <ArrowLeft size={12} /> Back to sign in
      </button>
    </form>
  );

  const viewTitles: Record<AuthView, string> = {
    login: "Login",
    signup: "Create Account",
    forgot: "Reset Password",
    legacy: "Access Password",
  };

  const viewIcons: Record<AuthView, React.ReactNode> = {
    login: <Lock size={28} style={{ color: "#FF6B2B" }} />,
    signup: <Mail size={28} style={{ color: "#FF6B2B" }} />,
    forgot: <Mail size={28} style={{ color: "#FF6B2B" }} />,
    legacy: <Lock size={28} style={{ color: "#FF6B2B" }} />,
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto"
      style={{ background: "#0d0d0d" }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,43,0.12) 0%, transparent 70%)",
          top: "10%", left: "15%", filter: "blur(60px)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 350, height: 350, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,179,71,0.10) 0%, transparent 70%)",
          bottom: "10%", right: "10%", filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2,
            background:
              i % 3 === 0
                ? "rgba(255,107,43,0.4)"
                : i % 3 === 1
                ? "rgba(255,179,71,0.35)"
                : "rgba(230,57,70,0.3)",
            left: `${10 + i * 11}%`, top: `${15 + (i % 4) * 20}%`,
          }}
          animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1, y: 0, scale: 1,
          x: shake ? [0, -10, 10, -8, 8, -4, 4, 0] : 0,
        }}
        transition={
          shake
            ? { duration: 0.5, ease: "easeInOut" }
            : { duration: 0.7, ease: "easeOut" }
        }
        className="relative z-10 w-full max-w-md mx-4 my-8"
      >
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,43,0.15) 0%, rgba(230,57,70,0.15) 100%)",
                border: "1px solid rgba(255,107,43,0.2)",
              }}
            >
              {viewIcons[view]}
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-center font-serif text-3xl font-bold mb-1"
            style={{
              background: "linear-gradient(135deg, #FF6B2B 0%, #FFB347 50%, #E63946 100%)",
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
            {viewTitles[view]}
          </p>

          {/* Form */}
          {view === "login" && renderLoginForm()}
          {view === "signup" && renderSignUpForm()}
          {view === "forgot" && renderForgotForm()}
          {view === "legacy" && renderLegacyForm()}

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
