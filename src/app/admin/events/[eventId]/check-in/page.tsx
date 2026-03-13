"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  Check,
  X,
  User,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
  Keyboard,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRScanner } from "@/components/QRScanner";

interface CheckInResult {
  success: boolean;
  message: string;
  code?: string;
  registration?: {
    id: string;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    status: string;
    attendedAt?: string;
    invitedBy?: {
      name: string;
    };
  };
  event?: {
    hasBaptism: boolean;
  };
}

interface RecentCheckIn {
  id: string;
  name: string;
  email?: string;
  time: string;
  status: string;
}

export default function AdminCheckInPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [manualCode, setManualCode] = useState("");
  const [scanMode, setScanMode] = useState<"manual" | "camera">("manual");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [stats, setStats] = useState({ checkedIn: 0, total: 0 });
  const [eventTitle, setEventTitle] = useState("Event Check-In");

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (scanMode === "manual" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          checkedIn: data.attendedCount || 0,
          total: data.totalRegistrations || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, [eventId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const playSound = (type: "success" | "error") => {
    if (!soundEnabled) return;
    // In production, would play actual sound
    console.log(`Playing ${type} sound`);
  };

  const handleCheckIn = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || processing) return;

    setProcessing(true);
    setCheckInResult(null);

    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationCode: cleanCode,
          eventId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        playSound("success");
        setCheckInResult({
          success: true,
          message: "Check-in successful!",
          registration: data.registration,
          event: data.event,
        });

        // Add to recent check-ins
        setRecentCheckIns((prev) => [
          {
            id: data.registration.id,
            name: data.registration.guestName,
            email: data.registration.guestEmail,
            time: new Date().toLocaleTimeString(),
            status: "attended",
          },
          ...prev.slice(0, 9),
        ]);

        // Update stats
        fetchStats();
      } else {
        playSound("error");
        setCheckInResult({
          success: false,
          message: data.error || "Check-in failed",
          code: data.code,
          registration: data.registration,
        });
      }
    } catch (error) {
      playSound("error");
      setCheckInResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setProcessing(false);
      setManualCode("");
      inputRef.current?.focus();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(manualCode);
  };

  const dismissResult = () => {
    setCheckInResult(null);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Check-In</h1>
            <p className="text-slate-500">Scan QR codes or enter codes manually</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
            <Users className="w-5 h-5 text-green-600" />
            <span className="font-bold">{stats.checkedIn}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-600">{stats.total}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === "manual" ? "default" : "outline"}
              onClick={() => setScanMode("manual")}
              className="flex-1"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
            <Button
              variant={scanMode === "camera" ? "default" : "outline"}
              onClick={() => setScanMode("camera")}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera Scan
            </Button>
          </div>

          {/* Scanner Area */}
          <Card className="bg-white p-8">
            {scanMode === "manual" ? (
              <div className="text-center">
                <QrCode className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2">
                  Enter Registration Code
                </h2>
                <p className="text-slate-500 mb-6">
                  Type the guest's code from their QR code or ticket
                </p>
                <form onSubmit={handleManualSubmit} className="max-w-md mx-auto">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., ABC12345)"
                      className="text-center text-2xl tracking-widest uppercase"
                      maxLength={12}
                      disabled={processing}
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={!manualCode.trim() || processing}
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Check In"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center">
                <QRScanner
                  onScan={(code) => {
                    // Extract registration code from QR data
                    try {
                      const data = JSON.parse(code);
                      handleCheckIn(data.code || code);
                    } catch {
                      // If not JSON, use the raw code
                      handleCheckIn(code);
                    }
                  }}
                  onError={(error) => console.error("Scanner error:", error)}
                />
              </div>
            )}
          </Card>

          {/* Check-in Result */}
          {checkInResult && (
            <Card
              className={`p-6 ${
                checkInResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    checkInResult.success ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {checkInResult.success ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold ${
                      checkInResult.success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {checkInResult.message}
                  </h3>
                  {checkInResult.registration && (
                    <div className="mt-2">
                      <p className="text-slate-800 text-lg">
                        {checkInResult.registration.guestName}
                      </p>
                      {checkInResult.registration.guestEmail && (
                        <p className="text-slate-600 text-sm">
                          {checkInResult.registration.guestEmail}
                        </p>
                      )}
                      {checkInResult.registration.invitedBy && (
                        <p className="text-slate-600 text-sm mt-1">
                          Invited by {checkInResult.registration.invitedBy.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissResult}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Recent Check-ins */}
        <div>
          <Card className="bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Check-ins</h2>
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            {recentCheckIns.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No check-ins yet. Scan a QR code to get started.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentCheckIns.map((checkIn, index) => (
                  <div
                    key={`${checkIn.id}-${index}`}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{checkIn.name}</p>
                      {checkIn.email && (
                        <p className="text-slate-500 text-sm">{checkIn.email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700">Checked In</Badge>
                      <p className="text-slate-500 text-xs mt-1">{checkIn.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white p-6 mt-4">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/events/${eventId}/registrations`}>
                  <Users className="w-4 h-4 mr-2" />
                  View All Registrations
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/events/${eventId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Event Details
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
