"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  RefreshCw,
  QrCode,
  Sparkles,
  Calendar,
  MapPin,
  BarChart3,
  Activity,
  Award,
  Wifi,
  WifiOff,
  Download,
  Bell,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEventStream } from "@/hooks/useEventStream";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface EventStats {
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
    maxAttendees: number | null;
    hasBaptism: boolean;
  };
  stats: {
    total: number;
    registered: number;
    waitlisted: number;
    attended: number;
    baptized: number;
    cancelled: number;
  };
  recentCheckIns: Array<{
    id: string;
    name: string;
    email: string;
    time: string;
    status: string;
    invitedBy: string | null;
  }>;
  hourlyCheckIns: Array<{ hour: string; count: number }>;
  dailyRegistrations: Array<{ date: string; count: number }>;
  topInviters: Array<{ id: string; name: string; count: number; attended: number }>;
  timestamp: string;
}

const COLORS = ["#c9a227", "#1e3a5f", "#10b981", "#8b5cf6", "#f97316"];

// Toast notification type for real-time updates
interface Notification {
  id: string;
  type: "check-in" | "baptism" | "registration";
  message: string;
  timestamp: Date;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  waitlisted: number;
  errors: Array<{ row: number; name: string; error: string }>;
}

export default function EventDashboardPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [sendConfirmation, setSendConfirmation] = useState(false);

  // Add notification helper
  const addNotification = useCallback((type: "check-in" | "baptism" | "registration", guestName: string) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message: type === "check-in"
        ? `${guestName} just checked in!`
        : type === "baptism"
        ? `${guestName} was baptized!`
        : `${guestName} just registered!`,
      timestamp: new Date(),
    };
    setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep last 5

    // Auto-remove after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 10000);
  }, []);

  // Real-time SSE connection
  const { connected, lastMessage } = useEventStream(resolvedParams.eventId, {
    onCheckIn: ({ guestName }) => {
      addNotification("check-in", guestName);
      // Refresh stats when check-in happens
      fetchStats();
    },
    onBaptism: ({ guestName }) => {
      addNotification("baptism", guestName);
      fetchStats();
    },
    onRegistration: ({ guestName }) => {
      addNotification("registration", guestName);
      fetchStats();
    },
  });

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 10 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchStats, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.eventId, autoRefresh]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("skipDuplicates", String(skipDuplicates));
      formData.append("sendConfirmation", String(sendConfirmation));

      const response = await fetch(`/api/events/${resolvedParams.eventId}/import`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data.results);
        fetchStats(); // Refresh stats after import
      } else {
        setImportResult({
          total: 0,
          imported: 0,
          skipped: 0,
          waitlisted: 0,
          errors: [{ row: 0, name: "Error", error: data.error || "Import failed" }],
        });
      }
    } catch (error) {
      setImportResult({
        total: 0,
        imported: 0,
        skipped: 0,
        waitlisted: 0,
        errors: [{ row: 0, name: "Error", error: "Network error - please try again" }],
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
    setSkipDuplicates(true);
    setSendConfirmation(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 text-center">
          <p className="text-white mb-4">Could not load event data</p>
          <Button onClick={fetchStats}>Try Again</Button>
        </Card>
      </div>
    );
  }

  const attendanceRate = stats.stats.total > 0
    ? Math.round((stats.stats.attended / stats.stats.total) * 100)
    : 0;

  const pieData = [
    { name: "Checked In", value: stats.stats.attended, color: "#10b981" },
    { name: "Registered", value: stats.stats.registered, color: "#3b82f6" },
    { name: "Waitlisted", value: stats.stats.waitlisted, color: "#f97316" },
    { name: "Cancelled", value: stats.stats.cancelled, color: "#6b7280" },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-700">
                <Link href="/admin">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{stats.event.title}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(stats.event.startDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {stats.event.location}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* SSE Connection Status */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                connected
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}>
                {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {connected ? "Live" : "Offline"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`${autoRefresh ? "bg-green-600 border-green-500" : "bg-slate-700 border-slate-600"} text-white`}
              >
                <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
                {autoRefresh ? "Auto" : "Paused"}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchStats} className="bg-slate-700 border-slate-600 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {/* Export Dropdown */}
              <div className="relative group">
                <Button variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <a
                    href={`/api/events/${resolvedParams.eventId}/export?format=csv`}
                    className="block px-4 py-2 text-sm text-white hover:bg-slate-700 rounded-t-lg"
                  >
                    Export Registrations (CSV)
                  </a>
                  <a
                    href={`/api/events/${resolvedParams.eventId}/export?type=attendance`}
                    className="block px-4 py-2 text-sm text-white hover:bg-slate-700"
                  >
                    Export Attendance (CSV)
                  </a>
                  <a
                    href={`/api/events/${resolvedParams.eventId}/export?type=summary`}
                    className="block px-4 py-2 text-sm text-white hover:bg-slate-700 rounded-b-lg"
                  >
                    Export Summary (CSV)
                  </a>
                </div>
              </div>
              {/* Import Button */}
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-700 border-slate-600 text-white"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button asChild className="bg-secondary hover:bg-secondary/90 text-slate-900">
                <Link href={`/event/${resolvedParams.eventId}/check-in`}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Check-In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-secondary" />
                Bulk Import Registrations
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
                onClick={resetImportModal}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {!importResult ? (
                <>
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Upload CSV File
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        importFile ? "border-secondary bg-secondary/10" : "border-slate-600 hover:border-slate-500"
                      }`}>
                        {importFile ? (
                          <div className="flex items-center justify-center gap-2 text-secondary">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">{importFile.name}</span>
                          </div>
                        ) : (
                          <div className="text-slate-400">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <p>Click or drag to upload CSV file</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/api/events/${resolvedParams.eventId}/import`}
                      className="inline-block mt-2 text-sm text-secondary hover:underline"
                    >
                      Download CSV template
                    </a>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-secondary focus:ring-secondary"
                      />
                      <span className="text-sm text-slate-300">Skip duplicate emails</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendConfirmation}
                        onChange={(e) => setSendConfirmation(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-secondary focus:ring-secondary"
                      />
                      <span className="text-sm text-slate-300">Send confirmation emails</span>
                    </label>
                  </div>

                  {/* CSV Format Info */}
                  <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-400">
                    <p className="font-medium text-slate-300 mb-1">Required columns:</p>
                    <p>name (required), email, phone, notes</p>
                  </div>
                </>
              ) : (
                /* Results */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-500/20 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-400">{importResult.imported}</p>
                      <p className="text-sm text-green-300">Imported</p>
                    </div>
                    <div className="bg-amber-500/20 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">{importResult.skipped}</p>
                      <p className="text-sm text-amber-300">Skipped</p>
                    </div>
                    {importResult.waitlisted > 0 && (
                      <div className="bg-orange-500/20 rounded-lg p-3 text-center col-span-2">
                        <p className="text-2xl font-bold text-orange-400">{importResult.waitlisted}</p>
                        <p className="text-sm text-orange-300">Added to Waitlist</p>
                      </div>
                    )}
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-slate-700/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <p className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        Issues ({importResult.errors.length})
                      </p>
                      <ul className="space-y-1 text-sm text-slate-400">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>
                            Row {err.row}: {err.name} - {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
              {!importResult ? (
                <>
                  <Button
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white"
                    onClick={resetImportModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-secondary hover:bg-secondary/90 text-slate-900"
                    onClick={handleImport}
                    disabled={!importFile || importing}
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-secondary hover:bg-secondary/90 text-slate-900"
                  onClick={resetImportModal}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Notifications Toast */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
                notification.type === "check-in"
                  ? "bg-green-600"
                  : notification.type === "baptism"
                  ? "bg-purple-600"
                  : "bg-blue-600"
              }`}
            >
              <Bell className="w-5 h-5 text-white" />
              <p className="text-white font-medium">{notification.message}</p>
            </div>
          ))}
        </div>
      )}

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.stats.total}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-600/50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.stats.registered}</p>
                <p className="text-xs text-slate-400">Registered</p>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.stats.attended}</p>
                <p className="text-xs text-slate-400">Checked In</p>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.stats.baptized}</p>
                <p className="text-xs text-slate-400">Baptized</p>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.stats.waitlisted}</p>
                <p className="text-xs text-slate-400">Waitlisted</p>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{attendanceRate}%</p>
                <p className="text-xs text-slate-400">Attendance</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hourly Check-ins Chart */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-secondary" />
                Check-ins by Hour
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hourlyCheckIns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="count" fill="#c9a227" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Daily Registrations Chart */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Registrations Over Time
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickFormatter={formatDate} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      labelStyle={{ color: "#fff" }}
                      labelFormatter={(label) => formatDate(String(label))}
                    />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Registration Status Breakdown */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Registration Status
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-3">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-300 text-sm">{entry.name}</span>
                      <span className="text-white font-semibold ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Check-ins */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-400" />
                Recent Check-ins
              </h2>
              {stats.recentCheckIns.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No check-ins yet</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {stats.recentCheckIns.map((checkIn, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        checkIn.status === "baptized" ? "bg-purple-500/20" : "bg-green-500/20"
                      }`}>
                        {checkIn.status === "baptized" ? (
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{checkIn.name}</p>
                        <p className="text-slate-400 text-xs truncate">
                          {checkIn.invitedBy ? `via ${checkIn.invitedBy}` : checkIn.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={checkIn.status === "baptized" ? "bg-purple-500" : "bg-green-500"}>
                          {checkIn.status}
                        </Badge>
                        <p className="text-slate-400 text-xs mt-1">{formatTime(checkIn.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Inviters */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary" />
                Top Inviters
              </h2>
              {stats.topInviters.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.topInviters.slice(0, 5).map((inviter, index) => (
                    <div key={inviter.id} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-secondary text-slate-900" :
                        index === 1 ? "bg-slate-300 text-slate-900" :
                        index === 2 ? "bg-orange-500 text-white" :
                        "bg-slate-600 text-white"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{inviter.name}</p>
                        <p className="text-slate-400 text-xs">
                          {inviter.attended} attended / {inviter.count} invited
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-secondary font-bold">{inviter.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href={`/event/${resolvedParams.eventId}/check-in`}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Open Check-In
                  </Link>
                </Button>
                {stats.event.hasBaptism && (
                  <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                    <Link href={`/event/${resolvedParams.eventId}/baptism`}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Record Baptism
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-center text-slate-500 text-sm mt-6">
            Last updated: {lastUpdate.toLocaleTimeString()}
            {autoRefresh && " (auto-refreshing every 10s)"}
          </p>
        )}
      </main>
    </div>
  );
}
