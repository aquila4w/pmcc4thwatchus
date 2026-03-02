"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck/config";
import Link from "next/link";
import { ArrowLeft, Save, Eye, Loader2, Check, AlertCircle, Smartphone, Tablet, Monitor, LayoutTemplate, X } from "lucide-react";
import { puckTemplates, PuckTemplate } from "@/lib/puck/templates";

type ViewportSize = "desktop" | "tablet" | "mobile";
const viewportSizes: Record<ViewportSize, { width: string; icon: typeof Monitor }> = {
  desktop: { width: "100%", icon: Monitor },
  tablet: { width: "768px", icon: Tablet },
  mobile: { width: "375px", icon: Smartphone },
};

const initialData: Data = { content: [], root: {} };

type DocumentInfo = {
  id: string;
  title: string;
  slug: string;
  collection: string;
  puckData: Data | null;
};

export default function PuckEditorForCollection({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const resolvedParams = use(params);
  const { collection, id } = resolvedParams;

  const [data, setData] = useState<Data>(initialData);
  const [docInfo, setDocInfo] = useState<DocumentInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [showTemplates, setShowTemplates] = useState(false);

  const collectionNames: Record<string, string> = {
    "news-events": "News/Event",
    "managed-events": "Managed Event",
    "posts": "Blog Post",
    "pages": "Page",
  };

  const getPreviewUrl = (col: string, slug: string): string => {
    switch (col) {
      case "managed-events": return `/register/${slug}`;
      case "news-events": return `/events/${slug}`;
      case "posts": return `/blog/${slug}`;
      case "pages": return `/${slug}`;
      default: return `/${slug}`;
    }
  };

  const collectionName = collectionNames[collection] || collection;

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/puck-content/${collection}/${id}`);
      if (!response.ok) throw new Error("Failed to load document");
      const result = await response.json();
      setDocInfo({ id: result.id, title: result.title, slug: result.slug, collection, puckData: result.puckData });
      if (result.puckData) setData(result.puckData);
    } catch (err) {
      console.error("Error loading document:", err);
      setError("Failed to load document.");
    } finally {
      setLoading(false);
    }
  }, [collection, id]);

  useEffect(() => { loadDocument(); }, [loadDocument]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async (newData: Data) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/puck-content/${collection}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puckData: newData }),
      });
      if (response.ok) {
        showMessage("success", "Saved!");
        setData(newData);
      } else {
        const result = await response.json();
        showMessage("error", result.error || "Failed to save");
      }
    } catch (err) {
      showMessage("error", "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (template: PuckTemplate) => {
    if (data.content.length > 0 && !confirm("Replace current content?")) return;
    setData(template.data);
    setShowTemplates(false);
    showMessage("success", "Template applied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-slate-800 rounded-xl border border-slate-700">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Error</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/cms" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 rounded-full font-semibold hover:bg-amber-400">
            <ArrowLeft className="w-4 h-4" /> Back to CMS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Compact Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cms" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-5 bg-slate-700" />
          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-medium rounded">{collectionName}</span>
          <h1 className="text-sm font-semibold text-white truncate max-w-[250px]">{docInfo?.title || "Untitled"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {message && (
            <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {message.type === "success" ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {message.text}
            </span>
          )}
          <div className="flex border border-slate-700 rounded overflow-hidden">
            {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => {
              const Icon = viewportSizes[size].icon;
              return (
                <button key={size} onClick={() => setViewport(size)} className={`p-1.5 ${viewport === size ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"}`}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowTemplates(true)} className="text-xs px-2 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded flex items-center gap-1">
            <LayoutTemplate className="w-3.5 h-3.5" /> Templates
          </button>
          {docInfo?.slug && (
            <Link href={getPreviewUrl(collection, docInfo.slug)} target="_blank" className="text-xs px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Preview
            </Link>
          )}
          <button onClick={() => handleSave(data)} disabled={saving} className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded font-semibold flex items-center gap-1 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Puck Editor */}
      <div className="flex-1 h-[calc(100vh-49px)]">
        <Puck config={puckConfig} data={data} onPublish={handleSave} onChange={setData} />
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[70vh] overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <span className="text-sm font-medium text-white">Choose Template</span>
              <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[calc(70vh-50px)] grid grid-cols-3 gap-3">
              {puckTemplates.map((template) => (
                <button key={template.id} onClick={() => handleApplyTemplate(template)} className="text-left p-3 bg-slate-700 border border-slate-600 rounded-lg hover:border-amber-500 transition-colors">
                  <div className="aspect-video bg-slate-600 rounded mb-2 flex items-center justify-center">
                    <LayoutTemplate className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-medium text-white truncate">{template.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dark Theme Styles */}
      <style jsx global>{`
        .Puck { --puck-color-azure-04: #c9a227; --puck-color-azure-05: #c9a227; background: #0f172a !important; }
        .Puck-header { display: none !important; }
        .Puck-leftSideBar, .Puck-rightSideBar { background: #1e293b !important; border-color: #334155 !important; }
        .Puck-frame { background: #0f172a !important; padding: 16px !important; display: flex !important; justify-content: center !important; }
        .Puck-frame > div { width: ${viewportSizes[viewport].width} !important; max-width: 100% !important; background: white !important; border-radius: ${viewport !== "desktop" ? "8px" : "0"} !important; box-shadow: ${viewport !== "desktop" ? "0 4px 20px rgba(0,0,0,0.3)" : "none"} !important; }
        .ComponentList { background: #1e293b !important; }
        .ComponentList-item { background: #334155 !important; border: 1px solid #475569 !important; border-radius: 6px !important; color: #e2e8f0 !important; }
        .ComponentList-item:hover { border-color: #c9a227 !important; }
        .ComponentList-category { color: #94a3b8 !important; font-size: 10px !important; }
        .FieldLabel { color: #cbd5e1 !important; font-size: 11px !important; }
        .Input, .TextArea, .Select { background: #334155 !important; border: 1px solid #475569 !important; color: #e2e8f0 !important; border-radius: 6px !important; font-size: 12px !important; }
        .Input:focus, .TextArea:focus { border-color: #c9a227 !important; }
        .Button--primary { background: #c9a227 !important; color: #0f172a !important; }
        .Button--secondary { background: #334155 !important; color: #e2e8f0 !important; }
      `}</style>
    </div>
  );
}
