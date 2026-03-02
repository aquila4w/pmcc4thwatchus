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
  Users,
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
  Keyboard,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  Droplets
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRScanner } from "@/components/QRScanner";

interface BaptismResult {
  success: boolean;
  message: string;
  code?: string;
  registration?: {
    id: string;
    guestName: string;
    guestEmail?: string;
    status: string;
    baptizedAt?: string;
  };
}

interface RecentBaptism {
  id: string;
  name: string;
  time: string;
}

export default function BaptismPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const [manualCode, setManualCode] = useState("");
  const [scanMode, setScanMode] = useState<"manual" | "camera">("manual");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [baptismResult, setBaptismResult] = useState<BaptismResult | null>(null);
  const [recentBaptisms, setRecentBaptisms] = useState<RecentBaptism[]>([]);
  const [baptismCount, setBaptismCount] = useState(0);
  const [eventTitle, setEventTitle] = useState("Baptism Recording");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scanMode === "manual" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const playSound = (type: "success" | "error") => {
    if (!soundEnabled) return;
    console.log(`Playing ${type} sound`);
  };

  const handleBaptism = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || processing) return;

    setProcessing(true);
    setBaptismResult(null);

    try {
      const response = await fetch("/api/baptism", {
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
        setBaptismResult({
          success: true,
          message: "Baptism recorded successfully!",
          registration: data.registration,
        });

        setRecentBaptisms((prev) => [
          {
            id: data.registration.id,
            name: data.registration.guestName,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9),
        ]);

        setBaptismCount((prev) => prev + 1);

        // Broadcast to SSE stream for real-time dashboard updates
        fetch(`/api/events/${resolvedParams.eventId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "baptism",
            data: {
              guestName: data.registration.guestName,
              ticketCode: cleanCode,
            },
          }),
        }).catch(() => {/* Ignore broadcast errors */});
      } else {
        playSound("error");
        setBaptismResult({
          success: false,
          message: data.error || "Could not record baptism",
          code: data.code,
          registration: data.registration,
        });
      }
    } catch (error) {
      playSound("error");
      setBaptismResult({
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
    handleBaptism(manualCode);
  };

  const dismissResult = () => {
    setBaptismResult(null);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-purple-950">
      {/* Header */}
      <header className="bg-purple-900 border-b border-purple-800 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-white hover:bg-purple-800"
              >
                <Link href={`/event/${resolvedParams.eventId}/check-in`}>
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Droplets className="w-6 h-6 text-purple-300" />
                  Baptism Recording
                </h1>
                <p className="text-sm text-purple-300">{eventTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-purple-800"
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-800 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <span className="text-white font-bold">{baptismCount}</span>
                <span className="text-purple-300">baptized</span>
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
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-purple-900 border-purple-700 text-white hover:bg-purple-800"
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
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-purple-900 border-purple-700 text-white hover:bg-purple-800"
              }
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera Scan
            </Button>
          </div>

          {/* Scanner Area */}
          <Card className="bg-purple-900 border-purple-800 p-8 mb-6">
            {scanMode === "manual" ? (
              <div className="text-center">
                <Droplets className="w-16 h-16 text-purple-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  Record Baptism
                </h2>
                <p className="text-purple-300 mb-6">
                  Scan or enter the guest's code to mark them as baptized
                </p>
                <form onSubmit={handleManualSubmit} className="max-w-md mx-auto">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="Enter registration code"
                      className="bg-purple-800 border-purple-700 text-white text-center text-2xl tracking-widest uppercase placeholder:text-purple-500"
                      maxLength={12}
                      disabled={processing}
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={!manualCode.trim() || processing}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Record"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center">
                <QRScanner
                  onScan={(code) => {
                    try {
                      const data = JSON.parse(code);
                      handleBaptism(data.code || code);
                    } catch {
                      handleBaptism(code);
                    }
                  }}
                  onError={(error) => console.error("Scanner error:", error)}
                  className="mb-4"
                />
                <p className="text-purple-300 text-sm">
                  Point camera at guest's QR code to record baptism
                </p>
              </div>
            )}
          </Card>

          {/* Baptism Result */}
          {baptismResult && (
            <Card
              className={`p-6 mb-6 ${
                baptismResult.success
                  ? "bg-purple-600/50 border-purple-400"
                  : "bg-red-900/50 border-red-700"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    baptismResult.success ? "bg-purple-400" : "bg-red-500"
                  }`}
                >
                  {baptismResult.success ? (
                    <Sparkles className="w-6 h-6 text-white" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold ${
                      baptismResult.success ? "text-purple-200" : "text-red-400"
                    }`}
                  >
                    {baptismResult.message}
                  </h3>
                  {baptismResult.registration && (
                    <div className="mt-2">
                      <p className="text-white text-lg">
                        {baptismResult.registration.guestName}
                      </p>
                      {baptismResult.success && (
                        <p className="text-purple-300 text-sm mt-1">
                          Congratulations on their new journey in faith!
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissResult}
                  className="text-purple-300 hover:text-white hover:bg-purple-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Baptisms */}
          <Card className="bg-purple-900 border-purple-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-300" />
                Recent Baptisms
              </h2>
            </div>
            {recentBaptisms.length === 0 ? (
              <div className="text-center py-8">
                <Droplets className="w-12 h-12 text-purple-700 mx-auto mb-4" />
                <p className="text-purple-400">
                  No baptisms recorded yet. Scan a guest's code to begin.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBaptisms.map((baptism, index) => (
                  <div
                    key={`${baptism.id}-${index}`}
                    className="flex items-center gap-4 p-3 bg-purple-800/50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{baptism.name}</p>
                      <p className="text-purple-400 text-sm">Baptized today</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-purple-500">Baptized</Badge>
                      <p className="text-purple-400 text-xs mt-1">{baptism.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Back Link */}
          <div className="text-center mt-8">
            <Button
              variant="outline"
              asChild
              className="bg-purple-900 border-purple-700 text-white hover:bg-purple-800"
            >
              <Link href={`/event/${resolvedParams.eventId}/check-in`}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Check-In
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
