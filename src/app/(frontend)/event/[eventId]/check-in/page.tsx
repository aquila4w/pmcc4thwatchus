"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  QrCode,
  Search,
  Check,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
  Keyboard,
  Volume2,
  VolumeX,
  Loader2
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

export default function CheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
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
          eventId: resolvedParams.eventId,
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
        setStats((prev) => ({ ...prev, checkedIn: prev.checkedIn + 1 }));

        // Broadcast to SSE stream for real-time dashboard updates
        fetch(`/api/events/${resolvedParams.eventId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "check-in",
            data: {
              guestName: data.registration.guestName,
              ticketCode: cleanCode,
            },
          }),
        }).catch(() => {/* Ignore broadcast errors */});
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
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-white hover:bg-slate-700"
              >
                <Link href="/admin">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Check-In</h1>
                <p className="text-sm text-slate-400">{eventTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-slate-700"
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-white font-bold">{stats.checkedIn}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-300">{stats.total}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={scanMode === "manual" ? "default" : "outline"}
              onClick={() => setScanMode("manual")}
              className={
                scanMode === "manual"
                  ? ""
                  : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              }
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
            <Button
              variant={scanMode === "camera" ? "default" : "outline"}
              onClick={() => setScanMode("camera")}
              className={
                scanMode === "camera"
                  ? ""
                  : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              }
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera Scan
            </Button>
          </div>

          {/* Scanner Area */}
          <Card className="bg-slate-800 border-slate-700 p-8 mb-6">
            {scanMode === "manual" ? (
              <div className="text-center">
                <QrCode className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  Enter Registration Code
                </h2>
                <p className="text-slate-400 mb-6">
                  Type the guest's code from their QR code or ticket
                </p>
                <form onSubmit={handleManualSubmit} className="max-w-md mx-auto">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., ABC12345)"
                      className="bg-slate-700 border-slate-600 text-white text-center text-2xl tracking-widest uppercase"
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
                  className="mb-4"
                />
                <p className="text-slate-400 text-sm">
                  Point camera at guest's QR code to automatically check them in
                </p>
              </div>
            )}
          </Card>

          {/* Check-in Result */}
          {checkInResult && (
            <Card
              className={`p-6 mb-6 ${
                checkInResult.success
                  ? "bg-green-900/50 border-green-700"
                  : "bg-red-900/50 border-red-700"
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
                      checkInResult.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {checkInResult.message}
                  </h3>
                  {checkInResult.registration && (
                    <div className="mt-2">
                      <p className="text-white text-lg">
                        {checkInResult.registration.guestName}
                      </p>
                      {checkInResult.registration.guestEmail && (
                        <p className="text-slate-400 text-sm">
                          {checkInResult.registration.guestEmail}
                        </p>
                      )}
                      {checkInResult.registration.invitedBy && (
                        <p className="text-slate-400 text-sm mt-1">
                          Invited by {checkInResult.registration.invitedBy.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {checkInResult.success && checkInResult.event?.hasBaptism && (
                  <Button
                    variant="outline"
                    className="bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
                    asChild
                  >
                    <Link href={`/event/${resolvedParams.eventId}/baptism`}>
                      Go to Baptism
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissResult}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Check-ins */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Check-ins</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            {recentCheckIns.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No check-ins yet. Scan a QR code to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn, index) => (
                  <div
                    key={`${checkIn.id}-${index}`}
                    className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{checkIn.name}</p>
                      {checkIn.email && (
                        <p className="text-slate-400 text-sm">{checkIn.email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-500">Checked In</Badge>
                      <p className="text-slate-400 text-xs mt-1">{checkIn.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
