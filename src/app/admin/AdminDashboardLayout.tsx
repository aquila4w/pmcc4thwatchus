"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Calendar,
  Users,
  UserCog,
  Building2,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Church,
  ChevronLeft,
  LayoutDashboard,
  Megaphone,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const ADMIN_ROLES = [
  "superAdmin",
  "districtCoordinator",
  "subDistrictCoordinator",
  "headMinister",
  "secretary",
  "eventAdmin",
];

function DashboardLayoutInternal({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        const role = userData.user?.role;
        if (!role || !ADMIN_ROLES.includes(role)) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
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
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary", "eventAdmin"],
    },
    {
      label: "Organization",
      icon: Building2,
      href: "/admin/organization",
      roles: ["superAdmin", "districtCoordinator"],
    },
    {
      label: "Events",
      icon: Calendar,
      href: "/admin/events",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary", "eventAdmin"],
    },
    {
      label: "Campaigns",
      icon: Mail,
      href: "/admin/campaigns",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary", "eventAdmin"],
    },
    {
      label: "Ad Placements",
      icon: Megaphone,
      href: "/admin/ad-placements",
      roles: ["superAdmin", "districtCoordinator", "eventAdmin"],
    },
    {
      label: "Online Platforms",
      icon: Globe,
      href: "/admin/platforms",
      roles: ["superAdmin", "districtCoordinator", "eventAdmin"],
    },
    {
      label: "Users",
      icon: UserCog,
      href: "/admin/users",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary", "eventAdmin"],
    },
    {
      label: "Guests",
      icon: Users,
      href: "/admin/guests",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "eventAdmin"],
    },
    {
      label: "Church Websites",
      icon: Globe,
      href: "/admin/church-sites",
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary"],
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
      roles: ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "headMinister", "secretary", "eventAdmin"],
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

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            You do not have permission to access the admin dashboard.
          </p>
          <Button onClick={() => router.push("/")}>
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const roleLabel = user ? (
    user.role === "superAdmin" ? "Super Admin"
    : user.role === "districtCoordinator" ? "District Coordinator"
    : user.role === "subDistrictCoordinator" ? "Sub-District Coordinator"
    : user.role === "headMinister" ? "Head Minister"
    : user.role === "secretary" ? "Secretary"
    : user.role === "eventAdmin" ? "Event Admin"
    : user.role
  ) : "";

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — Desktop: fixed, Mobile: overlay */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-slate-900 text-white transition-transform duration-300 z-50
          w-64
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${desktopSidebarOpen ? "lg:w-64" : "lg:w-20"}
          lg:transition-all
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {(mobileMenuOpen || desktopSidebarOpen) && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-slate-900">P</span>
              </div>
              <span className="font-semibold">Admin Dashboard</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (window.innerWidth >= 1024) {
                setDesktopSidebarOpen(!desktopSidebarOpen);
              }
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 lg:hidden" />
            {desktopSidebarOpen ? <ChevronLeft className="w-5 h-5 hidden lg:block" /> : <Menu className="w-5 h-5 hidden lg:block" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
                {(mobileMenuOpen || desktopSidebarOpen) && (
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
        {user && (mobileMenuOpen || desktopSidebarOpen) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
              </div>
            </div>
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
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          desktopSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold truncate">
                {filteredItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.label ||
                  "Dashboard"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            {user && (
              <>
                <span className="text-sm text-slate-500 hidden sm:inline truncate max-w-[150px]">
                  {user.name}
                </span>
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
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

// Default export for backward compatibility
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
