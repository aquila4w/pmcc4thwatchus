"use client";

import { useState, useEffect, use } from "react";
import { Render, Data } from "@measured/puck";
import { puckConfig } from "@/lib/puck/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Home } from "lucide-react";

interface PageData {
  id: string;
  name: string;
  slug: string;
  puckData: Data;
  status: string;
  description?: string;
}

export default function PublicPuckPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`/api/puck-pages/${resolvedParams.slug}`);

        if (response.ok) {
          const result = await response.json();

          // Only show published pages publicly
          if (result.page.status !== "published") {
            setError("Page not found");
            return;
          }

          setPageData({
            id: result.page.id,
            name: result.page.name,
            slug: result.page.slug,
            puckData: result.page.puckData,
            status: result.page.status,
            description: result.page.description,
          });
        } else {
          setError("Page not found");
        }
      } catch (err) {
        console.error("Error loading page:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [resolvedParams.slug]);

  // Update page title
  useEffect(() => {
    if (pageData?.name) {
      document.title = `${pageData.name} | PMCC 4th Watch`;
    }
  }, [pageData?.name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Page Not Found
            </h1>
            <p className="text-slate-500 mb-6">
              The page you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 rounded-full font-semibold hover:bg-amber-400 transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <main>
        <Render config={puckConfig} data={pageData.puckData} />
      </main>
      <Footer />
    </div>
  );
}
