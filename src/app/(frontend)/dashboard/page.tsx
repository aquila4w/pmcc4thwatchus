"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  Image,
  FolderTree,
  Settings,
  Palette,
  LayoutGrid,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Church,
  MapPin,
  Mail,
  QrCode,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  {
    group: "Content",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin", active: true },
      { label: "Posts", icon: FileText, href: "/admin/posts", count: 12 },
      { label: "Page Builder", icon: LayoutGrid, href: "/page-builder" },
      { label: "Media", icon: Image, href: "/admin/media", count: 156 },
      { label: "Categories", icon: FolderTree, href: "/admin/categories" },
    ]
  },
  {
    group: "Events",
    items: [
      { label: "Events", icon: Calendar, href: "/admin/events", count: 8 },
      { label: "Registrations", icon: QrCode, href: "/admin/registrations", count: 234 },
      { label: "Ad Placements", icon: Megaphone, href: "/dashboard/ad-placements" },
      { label: "Campaigns", icon: Mail, href: "/admin/campaigns", count: 3 },
    ]
  },
  {
    group: "Organization",
    items: [
      { label: "Users", icon: Users, href: "/admin/users", count: 48 },
      { label: "Churches", icon: Church, href: "/admin/churches", count: 52 },
      { label: "Sub-Districts", icon: MapPin, href: "/admin/sub-districts", count: 8 },
    ]
  },
  {
    group: "Settings",
    items: [
      { label: "Header", icon: Menu, href: "/admin/globals/header" },
      { label: "Footer", icon: Menu, href: "/admin/globals/footer" },
      { label: "Theme Settings", icon: Palette, href: "/admin/globals/theme" },
      { label: "Widgets", icon: LayoutGrid, href: "/admin/widgets" },
    ]
  },
];

const recentActivity = [
  { action: "New registration", detail: "John Doe registered for Spiritual Empowerment", time: "2 min ago", type: "registration" },
  { action: "Post published", detail: "Weekly devotional for March", time: "1 hour ago", type: "post" },
  { action: "Event updated", detail: "Apostolic Worship schedule changed", time: "3 hours ago", type: "event" },
  { action: "New member", detail: "Jane Smith joined from LA Church", time: "5 hours ago", type: "user" },
  { action: "Campaign sent", detail: "Event reminder sent to 156 guests", time: "1 day ago", type: "campaign" },
];

const stats = [
  { label: "Total Users", value: "1,234", change: "+12%", icon: Users, color: "bg-blue-500" },
  { label: "Active Events", value: "8", change: "+2", icon: Calendar, color: "bg-green-500" },
  { label: "Registrations", value: "456", change: "+34%", icon: QrCode, color: "bg-purple-500" },
  { label: "Churches", value: "52", change: "+4", icon: Church, color: "bg-orange-500" },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xs font-bold">P</span>
              </div>
              <span className="font-semibold">PMCC Admin</span>
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
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
          {sidebarItems.map((group) => (
            <div key={group.group}>
              {sidebarOpen && (
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold px-3 mb-2 block">
                  {group.group}
                </span>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        item.active
                          ? "bg-primary text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.count !== undefined && (
                            <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                              {item.count}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search..."
                className="pl-10 w-64 bg-slate-100 border-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                SA
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">Super Admin</p>
                <p className="text-xs text-muted-foreground">admin@pmcc4thwatch.us</p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, Super Admin</h1>
            <p className="text-muted-foreground">Here's what's happening in your church network.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change} this month</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="p-6 lg:col-span-1">
              <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/events/new">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/posts/new">
                    <FileText className="w-4 h-4 mr-2" />
                    New Post
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/page-builder">
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Visual Page Builder
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/dashboard/globals/theme">
                    <Palette className="w-4 h-4 mr-2" />
                    Edit Theme
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Recent Activity</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === "registration" ? "bg-purple-100 text-purple-600" :
                      activity.type === "post" ? "bg-blue-100 text-blue-600" :
                      activity.type === "event" ? "bg-green-100 text-green-600" :
                      activity.type === "user" ? "bg-orange-100 text-orange-600" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {activity.type === "registration" && <QrCode className="w-5 h-5" />}
                      {activity.type === "post" && <FileText className="w-5 h-5" />}
                      {activity.type === "event" && <Calendar className="w-5 h-5" />}
                      {activity.type === "user" && <Users className="w-5 h-5" />}
                      {activity.type === "campaign" && <Mail className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-muted-foreground text-sm">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Collections Overview */}
          <div className="mt-8">
            <h2 className="font-semibold text-lg mb-4">Manage Collections</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Posts", icon: FileText, count: 12, href: "/admin/posts" },
                { label: "Pages", icon: LayoutGrid, count: 5, href: "/admin/pages" },
                { label: "Media", icon: Image, count: 156, href: "/admin/media" },
                { label: "Categories", icon: FolderTree, count: 8, href: "/admin/categories" },
                { label: "Users", icon: Users, count: 48, href: "/admin/users" },
                { label: "Events", icon: Calendar, count: 8, href: "/admin/events" },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{item.label}</span>
                      <span className="text-muted-foreground text-xs">{item.count} items</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
