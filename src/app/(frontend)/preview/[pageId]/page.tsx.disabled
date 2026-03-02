"use client";

import { useState, useEffect, use } from "react";
import { Render, Data } from "@measured/puck";
import { puckConfig } from "@/lib/puck/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Edit, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface PageData {
  id: string;
  name: string;
  slug: string;
  puckData: Data;
  status: string;
  updatedAt: string;
}

export default function PreviewPage({ params }: { params: Promise<{ pageId: string }> }) {
  const resolvedParams = use(params);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        // First try to load from database API
        const response = await fetch(`/api/puck-pages/${resolvedParams.pageId}`);

        if (response.ok) {
          const result = await response.json();
          setPageData({
            id: result.page.id,
            name: result.page.name,
            slug: result.page.slug,
            puckData: result.page.puckData,
            status: result.page.status,
            updatedAt: result.page.updatedAt,
          });
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem(`puck-page-${resolvedParams.pageId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setPageData({
              id: parsed.id,
              name: parsed.name,
              slug: parsed.slug || resolvedParams.pageId,
              puckData: parsed.data || parsed.puckData,
              status: "draft",
              updatedAt: parsed.updatedAt,
            });
          } else {
            setError("Page not found");
          }
        }
      } catch (err) {
        console.error("Error loading page:", err);
        // Try localStorage as final fallback
        try {
          const stored = localStorage.getItem(`puck-page-${resolvedParams.pageId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setPageData({
              id: parsed.id,
              name: parsed.name,
              slug: parsed.slug || resolvedParams.pageId,
              puckData: parsed.data || parsed.puckData,
              status: "draft",
              updatedAt: parsed.updatedAt,
            });
          } else {
            setError("Failed to load page");
          }
        } catch {
          setError("Failed to load page");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [resolvedParams.pageId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span>Loading page...</span>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {error || "Page not found"}
          </h1>
          <p className="text-slate-500 mb-6">
            The page you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-lg flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <Link
              href="/page-builder"
              className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg flex items-center gap-2 hover:bg-amber-400 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Page Builder
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Edit banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-900 py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            Preview: {pageData.name}
          </span>
          {pageData.status !== "published" && (
            <span className="px-2 py-0.5 bg-amber-600/20 rounded text-xs font-semibold">
              {pageData.status.toUpperCase()}
            </span>
          )}
        </div>
        <Link
          href="/page-builder"
          className="flex items-center gap-2 text-sm font-medium hover:underline"
        >
          <Edit className="w-4 h-4" />
          Edit Page
        </Link>
      </div>

      <div className="pt-10">
        <Header />
        <main>
          <Render config={puckConfig} data={pageData.puckData} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
