"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Shield, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  inviteCode?: string;
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <Link
        href="/member/login"
        className="px-4 py-2 text-sm font-medium transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
      >
        Sign In
      </Link>
    );
  }

  const isAdmin = ["superAdmin", "districtCoordinator", "subDistrictCoordinator", "eventAdmin", "headMinister", "secretary"].includes(user.role);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">{user.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-56 z-50 rounded-xl border shadow-xl bg-white dark:bg-[#0a0f1a] border-slate-200 dark:border-white/10"
            >
              <div className="p-3 border-b border-slate-200 dark:border-white/10">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-white/60">{user.email}</p>
              </div>

              <div className="p-1">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white/80"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                )}

                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white/80"
                >
                  <Shield className="w-4 h-4" />
                  My Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
