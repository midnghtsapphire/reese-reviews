// ============================================================
// USER PROFILE PAGE
// Allows authenticated users to manage their profile.
// ============================================================

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Save, LogOut, Shield, Mail } from "lucide-react";

const ProfilePage = () => {
  const { user, profile, authMode, updateProfile, signOut, isAdmin } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await updateProfile({
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
    });

    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    }
  };

  return (
    <div className="min-h-screen gradient-dark-surface pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1
          className="text-3xl font-bold mb-8"
          style={{
            background: "linear-gradient(135deg, #FF6B2B 0%, #FFB347 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Profile Settings
        </h1>

        {/* Account Info Card */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User size={20} style={{ color: "#FF6B2B" }} />
            Account Information
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                {authMode === "supabase" ? user?.email || "No email" : "Authenticated via access password"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Shield size={16} style={{ color: isAdmin ? "#22c55e" : "rgba(255,255,255,0.4)" }} />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                Role: {isAdmin ? "Admin" : profile?.role || "User"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full" style={{
                background: authMode === "supabase" ? "rgba(34,197,94,0.15)" : "rgba(255,179,71,0.15)",
                color: authMode === "supabase" ? "#22c55e" : "#FFB347",
                border: `1px solid ${authMode === "supabase" ? "rgba(34,197,94,0.3)" : "rgba(255,179,71,0.3)"}`,
              }}>
                {authMode === "supabase" ? "Supabase Auth" : "Legacy Password"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Edit Card */}
        {authMode === "supabase" && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Edit Profile</h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Display Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="profile-avatar"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Avatar URL
                </label>
                <input
                  id="profile-avatar"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                />
              </div>

              {message && (
                <div
                  className="rounded-lg px-3 py-2 text-xs font-medium"
                  style={{
                    background: message.type === "success"
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(230,57,70,0.1)",
                    border: `1px solid ${message.type === "success"
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(230,57,70,0.2)"}`,
                    color: message.type === "success" ? "#22c55e" : "#E63946",
                  }}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #FF6B2B 0%, #E63946 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(255,107,43,0.25)",
                }}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* Sign Out */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "rgba(230,57,70,0.15)",
              border: "1px solid rgba(230,57,70,0.3)",
              color: "#E63946",
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Attribution */}
        <p className="text-center text-xs mt-8" style={{ color: "rgba(255,255,255,0.2)" }}>
          Authentication provided by Supabase — free and open-source
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
