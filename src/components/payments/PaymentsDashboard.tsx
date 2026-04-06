// ============================================================
// CART, STRIPE, SUBSCRIPTIONS, PLAID — PAYMENTS DASHBOARD
// Shopping cart, subscription tiers, Stripe integration,
// Plaid bank linking
// ============================================================
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart, CreditCard, Building2, CheckCircle2,
  Star, Zap, Crown, Trash2, Plus, Minus, Lock,
  ArrowRight, ExternalLink, Shield, Loader2, AlertCircle,
} from "lucide-react";
import {
  redirectToCheckout,
  getSubscriptionState,
  activateTier,
  handleCheckoutReturn,
  isStripeConfigured,
  type SubscriptionState,
} from "@/lib/stripeClient";
import PlaidBankConnect from "@/components/business/PlaidBankConnect";

// ─── SUBSCRIPTION TIERS ─────────────────────────────────────
interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  highlighted: boolean;
  icon: React.ReactNode;
  stripeTierId: "pro" | "business" | null;
}

const TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    interval: "month",
    features: [
      "5 AI review generations/month",
      "Basic SEO tools",
      "1 business entity",
      "CSV import",
      "Community support",
    ],
    highlighted: false,
    icon: <Star className="h-5 w-5" />,
    stripeTierId: null,
  },
  {
    id: "pro",
    name: "Pro Reviewer",
    price: 19.99,
    interval: "month",
    features: [
      "Unlimited AI review generations",
      "Advanced SEO dashboard",
      "3 business entities",
      "Video review creation",
      "Avatar customization",
      "Priority support",
      "Export to Amazon format",
      "Bulk generation",
    ],
    highlighted: true,
    icon: <Zap className="h-5 w-5" />,
    stripeTierId: "pro",
  },
  {
    id: "business",
    name: "Business Suite",
    price: 49.99,
    interval: "month",
    features: [
      "Everything in Pro",
      "Unlimited business entities",
      "Plaid bank linking",
      "Tax center with PDF export",
      "Auto marketing via Meta",
      "Content scheduling",
      "API access",
      "Dedicated support",
      "White-label options",
    ],
    highlighted: false,
    icon: <Crown className="h-5 w-5" />,
    stripeTierId: "business",
  },
];

// ─── CART ────────────────────────────────────────────────────
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  /** Discriminates subscription items from one-off items */
  type: "subscription" | "item";
  /** Non-null only when type === "subscription" */
  stripeTierId: "pro" | "business" | null;
}

// ─── COMPONENT ──────────────────────────────────────────────
export default function PaymentsDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionState>(getSubscriptionState);

  // ── Handle Stripe Checkout return URL ──────────────────────
  useEffect(() => {
    const result = handleCheckoutReturn();
    if (result === "success") {
      // Determine which tier was just purchased from cart or URL
      const params = new URLSearchParams(window.location.search);
      const tier = (params.get("tier") as "pro" | "business") ?? "pro";
      activateTier(tier);
      setSubscription(getSubscriptionState());
      toast({
        title: "🎉 Subscription activated!",
        description: `Welcome to the ${tier === "pro" ? "Pro Reviewer" : "Business Suite"} plan.`,
      });
      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
    } else if (result === "canceled") {
      toast({
        title: "Checkout canceled",
        description: "No charge was made. You can try again anytime.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  // ── Cart helpers ───────────────────────────────────────────
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const newQty = Math.max(0, i.quantity + delta);
          return newQty === 0 ? i : { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Stripe Checkout ────────────────────────────────────────
  const handleCheckout = async () => {
    const subscriptionItem = cart.find((i) => i.stripeTierId != null);
    const tierId = subscriptionItem?.stripeTierId ?? "pro";

    setCheckingOut(true);
    try {
      const origin = window.location.origin;
      const result = await redirectToCheckout(
        tierId,
        `${origin}/payments?success=true&tier=${tierId}`,
        `${origin}/payments?canceled=true`
      );

      if (result === "demo") {
        toast({
          title: "Stripe not configured",
          description: isStripeConfigured()
            ? "Set VITE_STRIPE_LINK_PRO / VITE_STRIPE_LINK_BUSINESS in your .env to enable checkout."
            : "Add VITE_STRIPE_PUBLISHABLE_KEY and payment link env vars to enable Stripe. See .env.example.",
        });
      } else if (result === "error") {
        toast({
          title: "Checkout unavailable",
          description:
            "Stripe Payment Links are not configured. Set VITE_STRIPE_LINK_PRO or VITE_STRIPE_LINK_BUSINESS in your environment.",
          variant: "destructive",
        });
      }
      // If "redirect", the page navigates away — no further action needed
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────
  const isActiveTier = (tierId: string) =>
    subscription.status === "active" && subscription.tier === tierId;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-steel-text">Payments & Subscriptions</h2>
        <p className="text-sm text-muted-foreground">Manage subscriptions, cart, and bank connections</p>
      </div>

      {/* ── Active subscription banner ──────────────────────── */}
      {subscription.status === "active" && subscription.tier !== "free" && (
        <Card className="glass-card steel-border border-green-500/30">
          <CardContent className="flex items-center gap-3 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Active plan:{" "}
                <span className="gradient-steel-text">
                  {subscription.tier === "pro" ? "Pro Reviewer" : "Business Suite"}
                </span>
              </p>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground">
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Demo mode banner ─────────────────────────────────── */}
      {!isStripeConfigured() && (
        <Card className="glass-card steel-border border-yellow-500/30">
          <CardContent className="flex items-start gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-400">Stripe is in demo mode</p>
              <p className="text-muted-foreground text-xs mt-1">
                Set <code className="bg-muted px-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code> and{" "}
                <code className="bg-muted px-1 rounded">VITE_STRIPE_LINK_PRO</code> /&nbsp;
                <code className="bg-muted px-1 rounded">VITE_STRIPE_LINK_BUSINESS</code> in{" "}
                <code className="bg-muted px-1 rounded">.env</code> to enable checkout.{" "}
                <a
                  href="https://dashboard.stripe.com/payment-links"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-1"
                >
                  Create Payment Links <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card">
          <TabsTrigger value="subscriptions"><CreditCard className="h-4 w-4 mr-1" /> Subscriptions</TabsTrigger>
          <TabsTrigger value="cart">
            <ShoppingCart className="h-4 w-4 mr-1" /> Cart
            {cart.length > 0 && <Badge className="ml-1" variant="destructive">{cart.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="plaid"><Building2 className="h-4 w-4 mr-1" /> Bank Linking</TabsTrigger>
        </TabsList>

        {/* ─── SUBSCRIPTIONS TAB ─────────────────────────── */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={`glass-card steel-border relative ${
                  tier.highlighted ? "ring-2 ring-primary" : ""
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-steel">Most Popular</Badge>
                  </div>
                )}
                {isActiveTier(tier.id) && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-600 text-white">Active</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    {tier.icon}
                  </div>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm text-muted-foreground">/{tier.interval}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${tier.highlighted ? "gradient-steel" : ""}`}
                    variant={tier.highlighted ? "default" : "outline"}
                    disabled={isActiveTier(tier.id) || tier.price === 0}
                    onClick={() => {
                      if (tier.price > 0 && tier.stripeTierId) {
                        addToCart({
                          id: `sub-${tier.id}`,
                          name: `${tier.name} Subscription`,
                          price: tier.price,
                          quantity: 1,
                          type: "subscription",
                          stripeTierId: tier.stripeTierId,
                        });
                        setActiveTab("cart");
                      }
                    }}
                  >
                    {isActiveTier(tier.id)
                      ? "Current Plan"
                      : tier.price === 0
                      ? "Free Plan"
                      : (
                        <>
                          Subscribe <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── CART TAB ──────────────────────────────────── */}
        <TabsContent value="cart" className="space-y-4">
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Shopping Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("subscriptions")}
                  >
                    Browse Plans
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg glass-card">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-medium text-sm w-20 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border/50 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold">Total</span>
                      <span className="text-xl font-bold">${cartTotal.toFixed(2)}/mo</span>
                    </div>
                    <Button
                      className="w-full gradient-steel"
                      onClick={handleCheckout}
                      disabled={checkingOut}
                    >
                      {checkingOut ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Redirecting to Stripe…
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-1" /> Checkout with Stripe
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Secure payment powered by Stripe
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PLAID TAB ─────────────────────────────────── */}
        <TabsContent value="plaid" className="space-y-4">
          <PlaidBankConnect />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-muted-foreground/50">
        Payment processing provided by Stripe · Bank linking provided by Plaid · Free and open-source APIs
      </p>
    </div>
  );
}
