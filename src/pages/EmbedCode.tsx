import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Code, Copy, Check, ArrowLeft, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const EmbedCode = () => {
  const { toast } = useToast();
  const { data: products } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [limit, setLimit] = useState("3");
  const [theme, setTheme] = useState("dark");
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed?product=${selectedProduct}&limit=${limit}&theme=${theme}`;
  
  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="400"
  style="border: none; border-radius: 8px;"
  title="Product Reviews"
></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen gradient-dark-surface">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-6">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <Code size={32} className="text-steel-shine" />
              <h1 className="font-serif text-3xl font-bold gradient-steel-text">
                Embed Reviews
              </h1>
            </div>
            <p className="text-muted-foreground">
              Display product reviews on your website with a simple embed code.
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-6 font-serif text-xl font-semibold text-card-foreground">
                Configure Widget
              </h2>

              <div className="space-y-4">
                <div>
                  <Label>Select Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.slug}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Number of Reviews</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full steel-border">
                      <Eye size={16} className="mr-2" />
                      Preview Widget
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>

            {/* Embed Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="mb-6 font-serif text-xl font-semibold text-card-foreground">
                Embed Code
              </h2>

              {selectedProduct ? (
                <>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg bg-secondary p-4 text-xs text-muted-foreground">
                      <code>{iframeCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute right-2 top-2"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-medium text-card-foreground">
                      Preview
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="300"
                        style={{ border: "none" }}
                        title="Widget Preview"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-secondary p-8 text-center">
                  <Code size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground">
                    Select a product to generate embed code
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EmbedCode;
