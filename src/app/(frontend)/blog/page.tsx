"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Loader2, Search, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: { url: string; alt: string } | null;
  author: { id: string; name: string } | null;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
  isFeatured: boolean;
  publishedAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let url = "/api/posts?limit=50";
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        if (selectedCategory) {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchQuery, selectedCategory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const featuredPosts = posts.filter((p) => p.isFeatured);
  const regularPosts = posts.filter((p) => !p.isFeatured);

  return (
    <main className="min-h-screen bg-[#f8f6f3]">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#0a0f1a] to-[#1a2744]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(201, 162, 39, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(201, 162, 39, 0.2) 0%, transparent 50%)`,
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-6">
              <BookOpen className="w-3 h-3 mr-1" />
              Our Blog
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Articles & Insights
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Discover inspiring stories, spiritual insights, and news from our community
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-serif font-bold text-slate-700 mb-2">
                No Posts Yet
              </h2>
              <p className="text-slate-500">
                Check back soon for new articles and insights.
              </p>
            </div>
          ) : (
            <>
              {/* Featured Posts */}
              {featuredPosts.length > 0 && (
                <div className="mb-16">
                  <h2 className="font-serif text-2xl font-bold text-[#0a0f1a] mb-8">
                    Featured Articles
                  </h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {featuredPosts.slice(0, 2).map((post, index) => (
                      <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="group"
                      >
                        <Link href={`/blog/${post.slug}`}>
                          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4">
                            {post.featuredImage ? (
                              <img
                                src={post.featuredImage.url}
                                alt={post.featuredImage.alt}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <BookOpen className="w-16 h-16 text-white/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <Badge className="absolute top-4 left-4 bg-secondary text-[#0a0f1a]">
                              Featured
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(post.publishedAt)}
                            </span>
                            {post.author && (
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {post.author.name}
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-[#0a0f1a] mb-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-slate-600 line-clamp-2">
                            {post.excerpt}
                          </p>
                        </Link>
                      </motion.article>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Posts */}
              {regularPosts.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#0a0f1a] mb-8">
                    Latest Articles
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularPosts.map((post, index) => (
                      <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                      >
                        <Link href={`/blog/${post.slug}`}>
                          <div className="relative aspect-[16/10] overflow-hidden">
                            {post.featuredImage ? (
                              <img
                                src={post.featuredImage.url}
                                alt={post.featuredImage.alt}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-6">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                              <Calendar className="w-3 h-3" />
                              {formatDate(post.publishedAt)}
                            </div>
                            <h3 className="font-serif text-lg font-bold text-[#0a0f1a] mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                              {post.excerpt}
                            </p>
                            <span className="text-primary font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                              Read More <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </Link>
                      </motion.article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
