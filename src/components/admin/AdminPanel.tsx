// ============================================================
// ADMIN PANEL — UI customization, user management, system
// settings, and analytics dashboard
// ============================================================
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Settings, Palette, Users, BarChart2, Shield, Globe,
  Save, Eye, Zap,
  CheckCircle2, TrendingUp, Activity,
} from "lucide-react";

// ─── SETTINGS STORE ─────────────────────────────────────────
// API keys are intentionally excluded — they must be set via environment
// variables (VITE_OPENROUTER_API_KEY, VITE_STRIPE_PUBLISHABLE_KEY,
// VITE_PLAID_CLIENT_ID) and are never stored in localStorage.
interface AdminSettings {
  siteName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  darkMode: boolean;
  glassmorphism: boolean;
  showFooter: boolean;
  maintenanceMode: boolean;
  analyticsEnabled: boolean;
  seoAutoGenerate: boolean;
}

const DEFAULT_SETTINGS: AdminSettings = {
  siteName: "Reese Reviews",
  tagline: "Honest Reviews From Box to Beautiful",
  primaryColor: "#6366f1",
  accentColor: "#f59e0b",
  logoUrl: "",
  darkMode: true,
  glassmorphism: true,
  showFooter: true,
  maintenanceMode: false,
  analyticsEnabled: true,
  seoAutoGenerate: true,
};

function loadSettings(): AdminSettings {
  try {
    const stored = localStorage.getItem("admin-settings");
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AdminSettings): void {
  localStorage.setItem("admin-settings", JSON.stringify(settings));
}

// ─── ANALYTICS DATA ─────────────────────────────────────────
interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: string;
  topPages: Array<{ page: string; views: number }>;
  reviewsGenerated: number;
  reviewsSubmitted: number;
  vineItemsTracked: number;
}

function getAnalytics(): AnalyticsData {
  // Pull real data from localStorage stores only
  let vineItems = 0;
  let reviewsGen = 0;
  let reviewsSub = 0;
  try {
    const items = JSON.parse(localStorage.getItem("vine-review-items") || "[]") as Array<{ status: string }>;
    vineItems = items.length;
    reviewsGen = items.filter((i) => ["generated", "edited", "submitted"].includes(i.status)).length;
    reviewsSub = items.filter((i) => i.status === "submitted").length;
  } catch {}

  return {
    pageViews: 0,
    uniqueVisitors: 0,
    avgSessionDuration: "--",
    bounceRate: "--",
    topPages: [],
    reviewsGenerated: reviewsGen,
    reviewsSubmitted: reviewsSub,
    vineItemsTracked: vineItems,
  };
}

// ─── COMPONENT ──────────────────────────────────────────────
export default function AdminPanel() {
  const [settings, setSettings] = useState<AdminSettings>(loadSettings);
  const [analytics] = useState<AnalyticsData>(getAnalytics);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("theme");

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-steel-text">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Manage site settings, theme, users, and analytics</p>
        </div>
        <Button onClick={handleSave} className="gradient-steel">
          {saved ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card">
          <TabsTrigger value="theme"><Palette className="h-4 w-4 mr-1" /> Theme</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Settings</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart2 className="h-4 w-4 mr-1" /> Analytics</TabsTrigger>
          <TabsTrigger value="integrations"><Zap className="h-4 w-4 mr-1" /> Integrations</TabsTrigger>
        </TabsList>

        {/* ─── THEME TAB ─────────────────────────────────── */}
        <TabsContent value="theme" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> UI Customization</CardTitle>
              <CardDescription>Customize the look and feel of your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Site Name</Label>
                  <Input value={settings.siteName} onChange={(e) => updateSetting("siteName", e.target.value)} />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input value={settings.tagline} onChange={(e) => updateSetting("tagline", e.target.value)} />
                </div>
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={settings.primaryColor} onChange={(e) => updateSetting("primaryColor", e.target.value)} className="w-16 h-10" />
                    <Input value={settings.primaryColor} onChange={(e) => updateSetting("primaryColor", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={settings.accentColor} onChange={(e) => updateSetting("accentColor", e.target.value)} className="w-16 h-10" />
                    <Input value={settings.accentColor} onChange={(e) => updateSetting("accentColor", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input value={settings.logoUrl} onChange={(e) => updateSetting("logoUrl", e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Dark Mode</Label>
                  <Switch checked={settings.darkMode} onCheckedChange={(v) => updateSetting("darkMode", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Glassmorphism</Label>
                  <Switch checked={settings.glassmorphism} onCheckedChange={(v) => updateSetting("glassmorphism", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Footer</Label>
                  <Switch checked={settings.showFooter} onCheckedChange={(v) => updateSetting("showFooter", v)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SETTINGS TAB ──────────────────────────────── */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">Show maintenance page to visitors</p>
                  </div>
                  <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => updateSetting("maintenanceMode", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Tracking</Label>
                    <p className="text-xs text-muted-foreground">Privacy-respecting analytics</p>
                  </div>
                  <Switch checked={settings.analyticsEnabled} onCheckedChange={(v) => updateSetting("analyticsEnabled", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto SEO Generation</Label>
                    <p className="text-xs text-muted-foreground">Auto-generate meta tags and alt text</p>
                  </div>
                  <Switch checked={settings.seoAutoGenerate} onCheckedChange={(v) => updateSetting("seoAutoGenerate", v)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── USERS TAB ─────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> User Management</CardTitle>
              <CardDescription>Manage users and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-gray-500 mb-3" />
                <p className="text-white font-medium mb-1">No users configured yet</p>
                <p className="text-gray-400 text-sm">User management will be available once Supabase Auth is fully configured.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ANALYTICS TAB ─────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Page Views", value: "--", icon: Eye, color: "text-blue-400", note: "Connect analytics" },
              { label: "Unique Visitors", value: "--", icon: Users, color: "text-green-400", note: "Connect analytics" },
              { label: "Avg Session", value: "--", icon: Activity, color: "text-purple-400", note: "Connect analytics" },
              { label: "Bounce Rate", value: "--", icon: TrendingUp, color: "text-orange-400", note: "Connect analytics" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="glass-card steel-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-500">{value}</p>
                  <p className="text-xs text-gray-600 mt-1">Google Analytics integration needed</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="glass-card steel-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{analytics.reviewsGenerated}</p>
                <p className="text-sm text-muted-foreground">Reviews Generated</p>
              </CardContent>
            </Card>
            <Card className="glass-card steel-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{analytics.reviewsSubmitted}</p>
                <p className="text-sm text-muted-foreground">Reviews Submitted</p>
              </CardContent>
            </Card>
            <Card className="glass-card steel-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">{analytics.vineItemsTracked}</p>
                <p className="text-sm text-muted-foreground">Vine Items Tracked</p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="text-sm">Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Globe className="h-8 w-8 text-gray-500 mb-2" />
                <p className="text-gray-400 text-sm">Connect Google Analytics or a similar service to see page traffic data.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── INTEGRATIONS TAB ──────────────────────────── */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> API Integrations</CardTitle>
              <CardDescription>
                API keys are configured via environment variables — never stored in the browser.
                Set them in your <code className="text-xs bg-white/10 px-1 rounded">.env</code> file locally or in the
                DigitalOcean App Platform dashboard for production.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-300 space-y-1">
                <p className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Security Notice</p>
                <p>API keys are read-only in the UI. To update a key, edit your <code className="text-xs">.env</code> file (local) or the environment variable settings in DigitalOcean (production), then redeploy.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    name: "OpenRouter (AI)",
                    envVar: "VITE_OPENROUTER_API_KEY",
                    value: import.meta.env.VITE_OPENROUTER_API_KEY,
                    hint: "Powers AI review generation. Set VITE_OPENROUTER_API_KEY.",
                  },
                  {
                    name: "Stripe (Payments)",
                    envVar: "VITE_STRIPE_PUBLISHABLE_KEY",
                    value: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
                    hint: "Enables subscription billing. Set VITE_STRIPE_PUBLISHABLE_KEY.",
                  },
                  {
                    name: "Plaid (Banking)",
                    envVar: "VITE_PLAID_CLIENT_ID",
                    value: import.meta.env.VITE_PLAID_CLIENT_ID,
                    hint: "Enables bank account linking. Set VITE_PLAID_CLIENT_ID.",
                  },
                  {
                    name: "Supabase",
                    envVar: "VITE_SUPABASE_URL",
                    value: import.meta.env.VITE_SUPABASE_URL,
                    hint: "Core database and auth. Set VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY.",
                  },
                ].map(({ name, envVar, value, hint }) => (
                  <div key={envVar} className="flex items-start justify-between p-4 rounded-lg glass-card gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                      <p className="text-xs font-mono text-muted-foreground/60 mt-1">{envVar}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={value ? "text-green-400 border-green-500/40 shrink-0" : "text-yellow-400 border-yellow-500/40 shrink-0"}
                    >
                      {value ? "✓ configured" : "not set"}
                    </Badge>
                  </div>
                ))}

                {[
                  { name: "Meta Business API", hint: "Set VITE_META_APP_ID when ready.", status: "stub ready" },
                  { name: "YouTube Data API v3", hint: "Set VITE_YOUTUBE_CLIENT_ID when ready.", status: "stub ready" },
                  { name: "HeyGen (Avatar Video)", hint: "Set HEYGEN_API_KEY (server-side) when ready.", status: "stub ready" },
                ].map(({ name, hint, status }) => (
                  <div key={name} className="flex items-start justify-between p-4 rounded-lg glass-card gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                    </div>
                    <Badge variant="outline" className="text-blue-400 border-blue-500/40 shrink-0">{status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-muted-foreground/50">
        Admin panel provided by free sources and APIs · Revvel Standards compliant
      </p>
    </div>
  );
}
