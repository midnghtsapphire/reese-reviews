import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, ThumbsUp, ThumbsDown } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { getFAQs } from "@/lib/seoStore";
import { getFAQs, searchFAQs } from "@/lib/seoStore";

const DEMO_FAQS = [];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});

  const faqs = getFAQs();

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: "getting-started", label: "Getting Started", count: faqs.filter((f) => f.category === "getting-started").length },
    { id: "features", label: "Features", count: faqs.filter((f) => f.category === "features").length },
    { id: "technical", label: "Technical", count: faqs.filter((f) => f.category === "technical").length },
    { id: "legal", label: "Legal", count: faqs.filter((f) => f.category === "legal").length },
    { id: "accessibility", label: "Accessibility", count: faqs.filter((f) => f.category === "accessibility").length },
  ];

  const handleHelpful = (id: string, isHelpful: boolean) => {
    setHelpful({ ...helpful, [id]: isHelpful });
  };

  return (
    <>
      <SEOHead
        title="FAQ | Reese Reviews"
        description="Frequently asked questions about Reese Reviews, accessibility, privacy, and more."
      />
      <div className="min-h-screen gradient-dark-surface pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mb-6">Find answers to common questions about Reese Reviews</p>

            {/* Search */}
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="glass-card steel-border sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => setSelectedCategory(null)}
                    variant={selectedCategory === null ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                  >
                    All ({faqs.length})
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      variant={selectedCategory === cat.id ? "default" : "ghost"}
                      className="w-full justify-start text-left"
                    >
                      {cat.label} ({cat.count})
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq) => (
                  <Card
                    key={faq.id}
                    className="glass-card steel-border overflow-hidden hover:border-border/60 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {faq.category.replace("-", " ")}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                            expandedId === faq.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>

                      {expandedId === faq.id && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                          <p className="text-muted-foreground">{faq.answer}</p>

                          <div className="flex flex-wrap gap-2">
                            {faq.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 pt-4 border-t border-border">
                            <span className="text-sm text-muted-foreground">Was this helpful?</span>
                            <Button
                              size="sm"
                              variant={helpful[faq.id] === true ? "default" : "ghost"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHelpful(faq.id, true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              {faq.helpful_count}
                            </Button>
                            <Button
                              size="sm"
                              variant={helpful[faq.id] === false ? "default" : "ghost"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHelpful(faq.id, false);
                              }}
                              className="flex items-center gap-1"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              {faq.not_helpful_count}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="glass-card steel-border">
                  <CardContent className="py-12 text-center" aria-label="No frequently asked questions available yet">
                    <p className="text-5xl mb-4" aria-hidden="true">❓</p>
                    <p className="text-muted-foreground font-medium">No FAQs yet.</p>
                    <p className="text-muted-foreground text-sm mt-1">Check back soon — we're adding answers!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
