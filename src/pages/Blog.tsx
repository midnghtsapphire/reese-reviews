import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye, Share2, Rss } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { getBlogPosts, generateRSSXML } from "@/lib/seoStore";

const DEMO_POSTS = [
  {
    id: "1",
    slug: "best-productivity-tools-2024",
    title: "The Best Productivity Tools for Remote Workers in 2024",
    description: "Discover the top tools that will transform your remote work setup and boost your efficiency.",
    category: "tips-tricks" as const,
    author: "Reese",
    featured_image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    tags: ["productivity", "remote-work", "tools"],
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    read_time_minutes: 8,
    view_count: 342,
  },
  {
    id: "2",
    slug: "amazon-vine-review-guide",
    title: "Complete Guide to Amazon Vine Reviews: How to Get Free Products",
    description: "Learn everything about Amazon Vine, how to qualify, and how to maximize your free product reviews.",
    category: "how-to" as const,
    author: "Reese",
    featured_image: "https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=800",
    tags: ["amazon", "vine", "reviews", "free-products"],
    published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    read_time_minutes: 12,
    view_count: 1205,
  },
  {
    id: "3",
    slug: "review-monetization-strategies",
    title: "How to Monetize Your Reviews: 5 Proven Strategies",
    description: "Turn your review business into a profitable venture with these affiliate and sponsorship strategies.",
    category: "product-updates" as const,
    author: "Reese",
    featured_image: "https://images.unsplash.com/photo-1554224311-beee415c15c7?w=800",
    tags: ["monetization", "affiliate", "business"],
    published_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    read_time_minutes: 10,
    view_count: 892,
  },
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const posts = getBlogPosts().length > 0 ? getBlogPosts() : DEMO_POSTS;

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: "how-to", label: "How-To", count: posts.filter((p) => p.category === "how-to").length },
    { id: "industry-news", label: "Industry News", count: posts.filter((p) => p.category === "industry-news").length },
    { id: "product-updates", label: "Product Updates", count: posts.filter((p) => p.category === "product-updates").length },
    { id: "tips-tricks", label: "Tips & Tricks", count: posts.filter((p) => p.category === "tips-tricks").length },
    { id: "case-studies", label: "Case Studies", count: posts.filter((p) => p.category === "case-studies").length },
  ];

  const handleDownloadRSS = () => {
    const rssXML = generateRSSXML();
    const blob = new Blob([rssXML], { type: "application/rss+xml" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reese-reviews-blog.xml";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <>
      <SEOHead
        title="Blog | Reese Reviews"
        description="Read the latest reviews, tips, and insights from Reese. How-to guides, industry news, and product updates."
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Blog</h1>
            <p className="text-gray-300 mb-6">Reviews, tips, and insights from Reese</p>

            {/* Search and RSS */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <Button onClick={handleDownloadRSS} className="glass-nav border border-purple-500/30 flex items-center gap-2">
                <Rss className="h-4 w-4" />
                RSS Feed
              </Button>
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
                    className="w-full justify-start"
                  >
                    All Articles ({posts.length})
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      variant={selectedCategory === cat.id ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      {cat.label} ({cat.count})
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <Card key={post.id} className="glass-card border-purple-500/20 overflow-hidden hover:border-purple-500/50 transition-colors">
                    <div className="md:flex">
                      {post.featured_image && (
                        <div className="md:w-1/3">
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="md:w-2/3">
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{post.category.replace("-", " ")}</Badge>
                            <span className="text-xs text-gray-400">{post.read_time_minutes} min read</span>
                          </div>
                          <CardTitle className="text-xl hover:text-purple-400 transition-colors cursor-pointer">
                            {post.title}
                          </CardTitle>
                          <CardDescription>{post.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {post.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(post.published_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.view_count} views
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <Button className="mt-4 gradient-steel">Read Article</Button>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="glass-card border-purple-500/20">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-400">No articles found matching your search.</p>
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
