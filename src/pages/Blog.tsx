import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Eye, Rss } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { getBlogPosts, generateRSSXML } from "@/lib/seoStore";

const DEMO_POSTS = [];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const posts = getBlogPosts();

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
      <div className="min-h-screen gradient-dark-surface pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Blog</h1>
            <p className="text-muted-foreground mb-6">Reviews, tips, and insights from Reese</p>

            {/* Search and RSS */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleDownloadRSS} variant="outline" className="glass-nav steel-border flex items-center gap-2">
                <Rss className="h-4 w-4" />
                RSS Feed
              </Button>
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
                  <Card key={post.id} className="glass-card steel-border overflow-hidden hover:border-border/60 transition-colors">
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
                      <div className={post.featured_image ? "md:w-2/3" : "w-full"}>
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{post.category.replace("-", " ")}</Badge>
                            <span className="text-xs text-muted-foreground">{post.read_time_minutes} min read</span>
                          </div>
                          <CardTitle className="text-xl hover:text-foreground transition-colors cursor-pointer">
                            {post.title}
                          </CardTitle>
                          <CardDescription>{post.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                          <div className="flex gap-2 mt-4 flex-wrap">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <Button className="mt-4 gradient-steel text-primary-foreground">Read Article</Button>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="glass-card steel-border">
                  <CardContent className="py-12 text-center" aria-label="No blog articles available yet">
                    <p className="text-5xl mb-4" aria-hidden="true">📝</p>
                    <p className="text-muted-foreground font-medium">No articles yet.</p>
                    <p className="text-muted-foreground text-sm mt-1">Check back soon — Reese is writing!</p>
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
