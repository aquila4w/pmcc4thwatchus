"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Calendar,
  Users,
  QrCode,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Church,
  Sparkles,
  Ticket,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  church?: {
    id: string;
    name: string;
  };
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  roles?: string[];
}

export function AdminDashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardLayoutInternal>{children}</DashboardLayoutInternal>;
}

function DashboardLayoutInternal({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setLoading(false);
      } else {
        router.push("/member/login?redirect=" + encodeURIComponent(window.location.pathname));
      }
    } catch (error) {
      router.push("/member/login?redirect=" + encodeURIComponent(window.location.pathname));
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/member/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Dashboard sidebar items
  const sidebarItems: SidebarItem[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"],
    },
    {
      label: "Events",
      icon: Calendar,
      href: "/admin/events",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"],
    },
    {
      label: "Campaigns",
      icon: Mail,
      href: "/admin/campaigns",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"],
    },
    {
      label: "Guests",
      icon: Users,
      href: "/admin/guests",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister"],
    },
    {
      label: "CMS Admin",
      icon: Settings,
      href: "/cms",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"],
    },
    {
      label: "My Church",
      icon: Church,
      href: "/admin/my-church",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"],
    },
  ];

  // Filter items based on user role
  const filteredItems = user
    ? sidebarItems.filter(
        (item) =>
          !item.roles || item.roles.includes(user.role)
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-slate-900">P</span>
              </div>
              <span className="font-semibold">Admin Dashboard</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]">
          {filteredItems.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-slate-900 text-xs"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {user && sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {user.role === "superAdmin"
                    ? "Super Admin"
                    : user.role === "districtCoordinator"
                    ? "District Coordinator"
                    : user.role === "subDistrictCoordinator"
                    ? "Sub-District Coordinator"
                    : user.role === "headMinister"
                    ? "Head Minister"
                    : user.role === "secretary"
                    ? "Secretary"
                    : user.role}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {filteredItems.find((item) => currentPath === item.href || currentPath.startsWith(item.href + "/"))?.label ||
                  "Dashboard"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push("/cms")}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Payload CMS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/member/admin")}>
                    <Home className="w-4 h-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

// Default export for backward compatibility
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
