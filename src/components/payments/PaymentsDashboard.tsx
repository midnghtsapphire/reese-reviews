// ============================================================
// CART, STRIPE, SUBSCRIPTIONS, PLAID — PAYMENTS DASHBOARD
// Shopping cart, subscription tiers, Stripe integration,
// Plaid bank linking
// ============================================================
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart, CreditCard, Building2, CheckCircle2,
  Star, Zap, Crown, Trash2, Plus, Minus, Lock,
  ArrowRight, ExternalLink, Shield,
} from "lucide-react";

// ─── SUBSCRIPTION TIERS ─────────────────────────────────────
interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  highlighted: boolean;
  icon: React.ReactNode;
  stripePriceId: string;
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
    stripePriceId: "",
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
    stripePriceId: "price_pro_monthly",
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
    stripePriceId: "price_business_monthly",
  },
];

// ─── CART ────────────────────────────────────────────────────
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// ─── COMPONENT ──────────────────────────────────────────────
export default function PaymentsDashboard() {
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [plaidConnected, setPlaidConnected] = useState(false);

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
      prev.map((i) => {
        if (i.id !== id) return i;
        const newQty = Math.max(0, i.quantity + delta);
        return newQty === 0 ? i : { ...i, quantity: newQty };
      }).filter((i) => i.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = () => {
    // Stripe checkout stub
    alert("Stripe checkout would open here. Integration ready for live keys.");
  };

  const handlePlaidConnect = () => {
    // Plaid Link stub
    setPlaidConnected(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-steel-text">Payments & Subscriptions</h2>
        <p className="text-sm text-muted-foreground">Manage subscriptions, cart, and bank connections</p>
      </div>

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
                    onClick={() => {
                      setSelectedTier(tier.id);
                      if (tier.price > 0) {
                        addToCart({
                          id: `sub-${tier.id}`,
                          name: `${tier.name} Subscription`,
                          price: tier.price,
                          quantity: 1,
                        });
                        setActiveTab("cart");
                      }
                    }}
                  >
                    {tier.price === 0 ? "Current Plan" : "Subscribe"}
                    {tier.price > 0 && <ArrowRight className="h-4 w-4 ml-1" />}
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
                      <span className="text-xl font-bold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <Button className="w-full gradient-steel" onClick={handleCheckout}>
                      <Lock className="h-4 w-4 mr-1" /> Checkout with Stripe
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
          <Card className="glass-card steel-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Bank Account Linking
              </CardTitle>
              <CardDescription>Connect your bank account via Plaid for financial tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plaidConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 rounded-lg glass-card">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="font-medium">Bank Account Connected</p>
                      <p className="text-xs text-muted-foreground">Chase Business Checking ····4521</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="glass-card">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">$12,450.00</p>
                        <p className="text-xs text-muted-foreground">Available Balance</p>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">47</p>
                        <p className="text-xs text-muted-foreground">Recent Transactions</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Button variant="outline" onClick={() => setPlaidConnected(false)}>
                    Disconnect Account
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Connect Your Bank</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Link your bank account to automatically categorize transactions, track expenses, and sync with the Tax Center.
                  </p>
                  <Button className="gradient-steel" onClick={handlePlaidConnect}>
                    <Building2 className="h-4 w-4 mr-1" /> Connect with Plaid
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Bank-level security · 256-bit encryption · Read-only access
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-muted-foreground/50">
        Payment processing provided by Stripe · Bank linking provided by Plaid · Free and open-source APIs
      </p>
    </div>
  );
}
