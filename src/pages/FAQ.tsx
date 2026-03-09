import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Search, ThumbsUp, ThumbsDown, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import { getFAQs, searchFAQs } from "@/lib/seoStore";

const DEMO_FAQS = [
  {
    id: "1",
    question: "How do I submit a review?",
    answer: "Click the 'Submit Review' button in the navigation menu. Fill out the form with your review details, upload photos if you'd like, and select your star rating. Your review will be published immediately.",
    category: "getting-started" as const,
    tags: ["submission", "reviews"],
    helpful_count: 45,
    not_helpful_count: 2,
    related_faqs: ["2", "3"],
  },
  {
    id: "2",
    question: "Can I edit my review after submitting?",
    answer: "Yes! You can edit your review anytime by going to your profile and clicking 'Edit' on the review you want to modify. Changes will be reflected immediately.",
    category: "features" as const,
    tags: ["editing", "reviews"],
    helpful_count: 32,
    not_helpful_count: 1,
    related_faqs: ["1"],
  },
  {
    id: "3",
    question: "What are the accessibility features?",
    answer: "We offer three accessibility modes: Neurodivergent (simplified layout), ECO CODE (reduced animations and data), and No Blue Light (warm color scheme). Toggle these in the accessibility menu in the top navigation.",
    category: "accessibility" as const,
    tags: ["accessibility", "features"],
    helpful_count: 78,
    not_helpful_count: 3,
    related_faqs: [],
  },
  {
    id: "4",
    question: "How do you make money from reviews?",
    answer: "We use affiliate links for products we recommend. When you click an affiliate link and make a purchase, we earn a small commission at no extra cost to you. This helps us maintain the platform.",
    category: "legal" as const,
    tags: ["monetization", "affiliate"],
    helpful_count: 56,
    not_helpful_count: 4,
    related_faqs: [],
  },
  {
    id: "5",
    question: "Is my personal information safe?",
    answer: "Yes. We use industry-standard encryption and never sell your data. Your email is only used for notifications you've opted into. See our Privacy Policy for full details.",
    category: "legal" as const,
    tags: ["privacy", "security"],
    helpful_count: 89,
    not_helpful_count: 2,
    related_faqs: [],
  },
  {
    id: "6",
    question: "Can I download my data?",
    answer: "Yes! You can request a data export from your account settings. We'll compile all your reviews, profile information, and activity into a downloadable file within 24 hours.",
    category: "technical" as const,
    tags: ["data", "export"],
    helpful_count: 23,
    not_helpful_count: 1,
    related_faqs: [],
  },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [numFAQs, setNumFAQs] = useState("10");
  const [selectedGenCategory, setSelectedGenCategory] = useState("getting-started");
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const faqs = getFAQs().length > 0 ? getFAQs() : DEMO_FAQS;

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

  const handleGenerateFAQs = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenRouter API key. The field cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Mock generation with delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Generation Complete (Mock)",
      description: `Successfully generated ${numFAQs} FAQs in the ${selectedGenCategory} category. Note: This is a placeholder - actual LLM integration not implemented.`,
    });

    setIsGenerating(false);
    setGenerateDialogOpen(false);
    setApiKey("");
  };

  return (
    <>
      <SEOHead
        title="FAQ | Reese Reviews"
        description="Frequently asked questions about Reese Reviews, accessibility, privacy, and more."
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Frequently Asked Questions</h1>
            <p className="text-gray-300 mb-6">Find answers to common questions about Reese Reviews</p>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-steel flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate FAQs
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-purple-500/20 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Generate FAQs</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Use AI to generate frequently asked questions. This is a placeholder for OpenRouter LLM integration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Number of FAQs</label>
                      <Select value={numFAQs} onValueChange={setNumFAQs}>
                        <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-purple-500/30">
                          <SelectItem value="10">10 questions</SelectItem>
                          <SelectItem value="25">25 questions</SelectItem>
                          <SelectItem value="50">50 questions</SelectItem>
                          <SelectItem value="100">100 questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Category</label>
                      <Select value={selectedGenCategory} onValueChange={setSelectedGenCategory}>
                        <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-purple-500/30">
                          <SelectItem value="getting-started">Getting Started</SelectItem>
                          <SelectItem value="features">Features</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="accessibility">Accessibility</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">OpenRouter API Key</label>
                      <Input
                        type="password"
                        placeholder="sk-or-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="bg-slate-800 border-purple-500/30 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        Your API key is not stored and only used for this generation
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setGenerateDialogOpen(false)}
                      disabled={isGenerating}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="gradient-steel"
                      onClick={handleGenerateFAQs}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="glass-card border-purple-500/20 sticky top-24">
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
                    className="glass-card border-purple-500/20 overflow-hidden hover:border-purple-500/50 transition-colors cursor-pointer"
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
                          <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-purple-400 transition-transform flex-shrink-0 ${
                            expandedId === faq.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>

                      {expandedId === faq.id && (
                        <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-4">
                          <p className="text-gray-300">{faq.answer}</p>

                          <div className="flex flex-wrap gap-2">
                            {faq.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 pt-4 border-t border-purple-500/20">
                            <span className="text-sm text-gray-400">Was this helpful?</span>
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
                <Card className="glass-card border-purple-500/20">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-400">No FAQs found matching your search.</p>
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
