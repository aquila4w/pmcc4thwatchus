"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { THEME_LABELS } from "@/lib/church-site-types";

interface Church {
  id: string;
  name: string;
  slug: string;
  city: string;
}

export default function NewChurchSitePage() {
  const router = useRouter();
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurch, setSelectedChurch] = useState("");
  const [template, setTemplate] = useState("modern");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const res = await fetch("/api/churches");
        if (!res.ok) throw new Error("Failed to fetch churches");
        const data = await res.json();
        setChurches(data.docs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load churches");
      } finally {
        setLoading(false);
      }
    };
    fetchChurches();
  }, []);

  const handleCreate = async () => {
    if (!selectedChurch) {
      setError("Please select a church");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/church-sites-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          church: selectedChurch,
          template,
          published: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create site");
      }

      const data = await res.json();
      router.push(`/admin/church-sites/${data.doc?.id || data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/church-sites")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
          Create Church Website
        </h1>
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        </Card>
      )}

      <Card className="p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Church
            </label>
            <select
              value={selectedChurch}
              onChange={(e) => setSelectedChurch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- Select a church --</option>
              {churches.map((church) => (
                <option key={church.id} value={church.id}>
                  {church.name} ({church.slug})
                </option>
              ))}
            </select>
            {selectedChurch && (
              <p className="text-sm text-slate-500 mt-1">
                Website URL: {churches.find(c => c.id === selectedChurch)?.slug}.pmcc4thwatch.us
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Design Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {Object.entries(THEME_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <Button onClick={handleCreate} disabled={creating || !selectedChurch} className="w-full">
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Create Website
          </Button>
        </div>
      </Card>
    </div>
  );
}
