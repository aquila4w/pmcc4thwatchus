"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, User, ArrowLeft, Loader2, BookOpen, Share2, Clock, Tag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PuckRenderer } from "@/components/PuckRenderer";
import type { Data } from "@measured/puck";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  contentMode: "richtext" | "blocks" | "puck";
  puckData: Data | null;
  pageLayout: unknown[] | null;
  featuredImage: { url: string; alt: string } | null;
  gallery: { url: string; alt: string; caption: string }[];
  author: { id: string; name: string } | null;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
  isFeatured: boolean;
  publishedAt: string;
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${resolvedParams.slug}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
        } else {
          setError("Post not found");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [resolvedParams.slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f6f3]">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-[#f8f6f3]">
        <Header />
        <div className="container mx-auto px-4 py-40 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-slate-700 mb-2">
            Post Not Found
          </h1>
          <p className="text-slate-500 mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f3]">
      <Header />

      {/* Hero */}
      <section className="relative pt-20">
        <div className="absolute inset-0 h-[60vh]">
          {post.featuredImage ? (
            <img
              src={post.featuredImage.url}
              alt={post.featuredImage.alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0a0f1a] to-[#1a2744]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/70 via-[#0a0f1a]/50 to-[#f8f6f3]" />
        </div>

        <div className="relative container mx-auto px-4 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {/* Categories */}
            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((category) => (
                  <Badge
                    key={category.id}
                    className="bg-secondary text-[#0a0f1a]"
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-white/70 text-xl mb-8">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-white/80">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                {formatDate(post.publishedAt)}
              </span>
              {post.author && (
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5 text-secondary" />
                  {post.author.name}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={sharePost}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="relative -mt-16 pb-20">
        <div className="container mx-auto px-4">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Puck Content */}
              {post.contentMode === "puck" && post.puckData ? (
                <PuckRenderer data={post.puckData} />
              ) : (
                /* Rich Text Content */
                <div className="p-8 md:p-12">
                  <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#0a0f1a] prose-p:text-slate-600 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                    {/* Render rich text content */}
                    <RichTextRenderer content={post.content} />
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                {post.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-slate-600"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Gallery */}
            {post.gallery.length > 0 && (
              <div className="mt-12">
                <h3 className="font-serif text-xl font-bold text-[#0a0f1a] mb-6">
                  Gallery
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {post.gallery.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {image.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm">{image.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Author Card */}
            {post.author && (
              <div className="mt-12 p-6 bg-slate-50 rounded-2xl flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Written by</p>
                  <p className="font-semibold text-[#0a0f1a]">{post.author.name}</p>
                </div>
              </div>
            )}

            {/* Back to Blog */}
            <div className="mt-12 text-center">
              <Button asChild variant="outline">
                <Link href="/blog">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Articles
                </Link>
              </Button>
            </div>
          </motion.article>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// Simple Rich Text Renderer component
function RichTextRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") {
    return null;
  }

  const renderNode = (node: { type?: string; text?: string; children?: unknown[]; format?: number; tag?: string; url?: string }, index: number): React.ReactNode => {
    if (!node) return null;

    // Text node
    if (node.text !== undefined) {
      let text: React.ReactNode = node.text;
      if (node.format) {
        if (node.format & 1) text = <strong key={index}>{text}</strong>;
        if (node.format & 2) text = <em key={index}>{text}</em>;
        if (node.format & 8) text = <u key={index}>{text}</u>;
      }
      return text;
    }

    // Element nodes
    const children = Array.isArray(node.children)
      ? node.children.map((child, i) => renderNode(child as typeof node, i))
      : null;

    switch (node.type) {
      case "paragraph":
        return <p key={index}>{children}</p>;
      case "heading":
        const HeadingTag = (node.tag || "h2") as keyof JSX.IntrinsicElements;
        return <HeadingTag key={index}>{children}</HeadingTag>;
      case "list":
        if (node.tag === "ol") {
          return <ol key={index}>{children}</ol>;
        }
        return <ul key={index}>{children}</ul>;
      case "listitem":
        return <li key={index}>{children}</li>;
      case "link":
        return (
          <a key={index} href={node.url} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      case "quote":
        return <blockquote key={index}>{children}</blockquote>;
      default:
        return children;
    }
  };

  const rootContent = content as { root?: { children?: unknown[] } };
  if (rootContent.root?.children) {
    return (
      <>
        {rootContent.root.children.map((node, index) =>
          renderNode(node as Parameters<typeof renderNode>[0], index)
        )}
      </>
    );
  }

  return null;
}
