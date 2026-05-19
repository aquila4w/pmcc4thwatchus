"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Plus,
  Edit,
  Eye,
  Loader2,
  AlertCircle,
  ExternalLink,
  Palette,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ChurchSite {
  id: string;
  church: {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
  };
  published: boolean;
  template: string;
  updatedAt: string;
}

export default function ChurchSitesAdminPage() {
  const router = useRouter();
  const [sites, setSites] = useState<ChurchSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userChurch, setUserChurch] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserRole(userData.user?.role || "");
          setUserChurch(userData.user?.church || "");
        }

        // Fetch church sites
        const res = await fetch("/api/church-sites-admin");
        if (!res.ok) throw new Error("Failed to fetch sites");
        const data = await res.json();
        setSites(data.docs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isAdmin = ["superAdmin", "districtCoordinator"].includes(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-slate-500">{error}</p>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Globe className="w-7 h-7" />
            Church Websites
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage local church website content, design, and settings.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => router.push("/admin/church-sites/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Site
          </Button>
        )}
      </div>

      {sites.length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Church Websites Yet
          </h3>
          <p className="text-slate-500 mb-6">
            Create a website for a local church to get started.
          </p>
          {isAdmin && (
            <Button onClick={() => router.push("/admin/church-sites/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Site
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {sites.map((site) => (
            <Card key={site.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {site.church?.name || "Unknown Church"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>{site.church?.city}, {site.church?.state}</span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        {site.template}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        site.published
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {site.published ? (
                          <><CheckCircle2 className="w-3 h-3" /> Published</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Draft</>
                        )}
                      </span>
                      {site.church?.slug && (
                        <span className="text-xs text-slate-400">
                          {site.church.slug}.pmcc4thwatch.us
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {site.church?.slug && site.published && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${site.church.slug}.pmcc4thwatch.us`, "_blank")}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => router.push(`/admin/church-sites/${site.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
