"use client";

import { useState, useEffect, useCallback } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck/config";
import Link from "next/link";
import { ArrowLeft, Save, Eye, Loader2, Trash2, Plus, Database, HardDrive, Smartphone, Tablet, Monitor, LayoutTemplate, X } from "lucide-react";
import { puckTemplates, PuckTemplate } from "@/lib/puck/templates";

// Initial empty data
const initialData: Data = {
  content: [],
  root: {},
};

// Viewport sizes for preview
type ViewportSize = "desktop" | "tablet" | "mobile";
const viewportSizes: Record<ViewportSize, { width: string; label: string; icon: typeof Monitor }> = {
  desktop: { width: "100%", label: "Desktop", icon: Monitor },
  tablet: { width: "768px", label: "Tablet", icon: Tablet },
  mobile: { width: "375px", label: "Mobile", icon: Smartphone },
};

type PageInfo = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export default function PageBuilderPage() {
  const [data, setData] = useState<Data>(initialData);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageName, setPageName] = useState("Untitled Page");
  const [pageSlug, setPageSlug] = useState("");
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [useDatabase, setUseDatabase] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [showTemplates, setShowTemplates] = useState(false);

  // Load pages list
  const loadPages = useCallback(async () => {
    if (useDatabase) {
      try {
        const response = await fetch("/api/puck-pages");
        if (response.ok) {
          const result = await response.json();
          setPages(result.pages.map((p: PageInfo) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            status: p.status,
          })));
        }
      } catch (error) {
        console.error("Failed to load pages from database:", error);
        // Fall back to localStorage
        const savedPages = localStorage.getItem("puck-pages");
        if (savedPages) {
          setPages(JSON.parse(savedPages));
        }
      }
    } else {
      const savedPages = localStorage.getItem("puck-pages");
      if (savedPages) {
        setPages(JSON.parse(savedPages));
      }
    }
  }, [useDatabase]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Load selected page data
  useEffect(() => {
    const loadPageData = async () => {
      if (!selectedPageId) return;

      setLoading(true);
      try {
        if (useDatabase) {
          const response = await fetch(`/api/puck-pages/${selectedPageId}`);
          if (response.ok) {
            const result = await response.json();
            setData(result.page.puckData);
            setPageName(result.page.name);
            setPageSlug(result.page.slug);
          } else {
            showMessage("error", "Failed to load page from database");
          }
        } else {
          const pageData = localStorage.getItem(`puck-page-${selectedPageId}`);
          if (pageData) {
            const parsed = JSON.parse(pageData);
            setData(parsed.data || parsed.puckData);
            setPageName(parsed.name);
            setPageSlug(parsed.slug || "");
          }
        }
      } catch (error) {
        console.error("Error loading page:", error);
        showMessage("error", "Error loading page");
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [selectedPageId, useDatabase]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSave = async (newData: Data) => {
    setSaving(true);

    try {
      if (useDatabase) {
        // Save to database
        const slug = pageSlug || generateSlug(pageName);

        if (selectedPageId) {
          // Update existing page
          const response = await fetch(`/api/puck-pages/${selectedPageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: pageName,
              slug,
              puckData: newData,
              status: "draft",
            }),
          });

          if (response.ok) {
            const result = await response.json();
            setPageSlug(result.page.slug);
            showMessage("success", "Page saved to database successfully!");
            loadPages();
          } else {
            const error = await response.json();
            showMessage("error", error.error || "Failed to save page");
          }
        } else {
          // Create new page
          const response = await fetch("/api/puck-pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: pageName,
              slug,
              puckData: newData,
              status: "draft",
            }),
          });

          if (response.ok) {
            const result = await response.json();
            setSelectedPageId(result.page.id);
            setPageSlug(result.page.slug);
            showMessage("success", "Page created in database successfully!");
            loadPages();
          } else {
            const error = await response.json();
            showMessage("error", error.error || "Failed to create page");
          }
        }
      } else {
        // Save to localStorage (fallback)
        const pageId = selectedPageId || `page-${Date.now()}`;
        const slug = pageSlug || generateSlug(pageName);

        localStorage.setItem(`puck-page-${pageId}`, JSON.stringify({
          id: pageId,
          name: pageName,
          slug,
          data: newData,
          updatedAt: new Date().toISOString(),
        }));

        const updatedPages = selectedPageId
          ? pages.map(p => p.id === pageId ? { ...p, name: pageName, slug, status: "draft" } : p)
          : [...pages, { id: pageId, name: pageName, slug, status: "draft" }];

        setPages(updatedPages);
        localStorage.setItem("puck-pages", JSON.stringify(updatedPages));
        setSelectedPageId(pageId);
        setPageSlug(slug);
        showMessage("success", "Page saved to local storage!");
      }
    } catch (error) {
      console.error("Save error:", error);
      showMessage("error", "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPageId) return;

    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      if (useDatabase) {
        const response = await fetch(`/api/puck-pages/${selectedPageId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          showMessage("success", "Page deleted successfully!");
          handleNewPage();
          loadPages();
        } else {
          showMessage("error", "Failed to delete page");
        }
      } else {
        localStorage.removeItem(`puck-page-${selectedPageId}`);
        const updatedPages = pages.filter(p => p.id !== selectedPageId);
        setPages(updatedPages);
        localStorage.setItem("puck-pages", JSON.stringify(updatedPages));
        handleNewPage();
        showMessage("success", "Page deleted from local storage!");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showMessage("error", "Failed to delete page");
    }
  };

  const handleNewPage = () => {
    setSelectedPageId(null);
    setPageName("Untitled Page");
    setPageSlug("");
    setData(initialData);
  };

  const handlePageSelect = (value: string) => {
    if (value === "new") {
      handleNewPage();
    } else if (value) {
      setSelectedPageId(value);
    }
  };

  const handleApplyTemplate = (template: PuckTemplate) => {
    if (data.content.length > 0) {
      if (!confirm("Applying a template will replace your current content. Continue?")) {
        return;
      }
    }
    setData(template.data);
    if (!pageName || pageName === "Untitled Page") {
      setPageName(template.name);
    }
    setShowTemplates(false);
    showMessage("success", `Template "${template.name}" applied!`);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-6 bg-slate-200" />

          {/* Page Name Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 w-48"
              placeholder="Page Name"
            />
            <span className="text-slate-400 text-sm">/</span>
            <input
              type="text"
              value={pageSlug}
              onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="text-sm text-slate-500 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 w-32"
              placeholder="page-slug"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Message Display */}
          {message && (
            <div className={`px-3 py-1 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
              {message.text}
            </div>
          )}

          {/* Viewport Selector */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => {
              const { label, icon: Icon } = viewportSizes[size];
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setViewport(size)}
                  className={`p-2 transition-colors ${
                    viewport === size
                      ? "bg-amber-500 text-slate-900"
                      : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Templates Button */}
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
          >
            <LayoutTemplate className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Storage Toggle */}
          <button
            type="button"
            onClick={() => setUseDatabase(!useDatabase)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              useDatabase
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`}
            title={useDatabase ? "Using Database" : "Using Local Storage"}
          >
            {useDatabase ? (
              <>
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Database</span>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4" />
                <span className="hidden sm:inline">Local</span>
              </>
            )}
          </button>

          {/* Page Selector */}
          <select
            value={selectedPageId || ""}
            onChange={(e) => handlePageSelect(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white max-w-[200px]"
          >
            <option value="">Select a page...</option>
            <option value="new">+ New Page</option>
            {pages.map(page => (
              <option key={page.id} value={page.id}>
                {page.name} {page.status === "published" ? "✓" : "(draft)"}
              </option>
            ))}
          </select>

          {/* New Page Button */}
          <button
            type="button"
            onClick={handleNewPage}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Delete Button */}
          {selectedPageId && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Preview Button */}
          <Link
            href={selectedPageId ? `/preview/${pageSlug || selectedPageId}` : "#"}
            target="_blank"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPageId
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-slate-50 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </Link>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => handleSave(data)}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-40 bg-white/80 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading page...</span>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-slate-900">Choose a Template</h2>
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Template Categories */}
              {["landing", "event", "ministry", "about", "contact", "general"].map((category) => {
                const categoryTemplates = puckTemplates.filter(t => t.category === category);
                if (categoryTemplates.length === 0) return null;
                return (
                  <div key={category} className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      {category.charAt(0).toUpperCase() + category.slice(1)} Pages
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleApplyTemplate(template)}
                          className="text-left p-4 border border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-colors group"
                        >
                          <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            <LayoutTemplate className="w-8 h-8 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-amber-700">
                            {template.name}
                          </h4>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Puck Editor */}
      <div className="pt-14">
        <Puck
          config={puckConfig}
          data={data}
          onPublish={handleSave}
          onChange={setData}
        />
      </div>

      {/* Custom Puck styling */}
      <style jsx global>{`
        /* Puck theme customization */
        .Puck {
          --puck-color-azure-04: #c9a227;
          --puck-color-azure-05: #c9a227;
          --puck-color-azure-06: #a88a1f;
          --puck-color-azure-07: #c9a227;
          --puck-color-azure-08: #d4b445;
          --puck-color-azure-09: #c9a227;
        }

        .Puck-header {
          display: none !important;
        }

        .Puck-leftSideBar {
          background: white !important;
          border-right: 1px solid #e5e7eb !important;
        }

        .Puck-rightSideBar {
          background: white !important;
          border-left: 1px solid #e5e7eb !important;
        }

        .Puck-frame {
          background: #f1f5f9 !important;
          display: flex !important;
          justify-content: center !important;
          padding: 20px !important;
        }

        .Puck-frame > div {
          width: ${viewportSizes[viewport].width} !important;
          max-width: 100% !important;
          transition: width 0.3s ease !important;
          background: white !important;
          box-shadow: ${viewport !== "desktop" ? "0 4px 20px rgba(0,0,0,0.1)" : "none"} !important;
          border-radius: ${viewport !== "desktop" ? "8px" : "0"} !important;
          overflow: hidden !important;
        }

        /* Component list styling */
        .ComponentList-item {
          border-radius: 8px !important;
          border: 1px solid #e5e7eb !important;
          transition: all 0.2s ease !important;
        }

        .ComponentList-item:hover {
          border-color: #c9a227 !important;
          background: rgba(201, 162, 39, 0.05) !important;
        }

        /* Field styling */
        .FieldLabel {
          font-weight: 600 !important;
          color: #374151 !important;
        }

        .Input {
          border-radius: 8px !important;
          border: 1.5px solid #e5e7eb !important;
        }

        .Input:focus {
          border-color: #c9a227 !important;
          box-shadow: 0 0 0 3px rgba(201, 162, 39, 0.12) !important;
        }

        /* Category headers */
        .ComponentList-category {
          font-weight: 600 !important;
          color: #1e3a5f !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.5px !important;
        }
      `}</style>
    </div>
  );
}
