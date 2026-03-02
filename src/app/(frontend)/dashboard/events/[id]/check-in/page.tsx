"use client";

import { useState, useEffect, useRef } from "react";
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
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
  Keyboard,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "registered" | "attended" | "baptized";
  inviteCode: string;
  registeredAt: string;
  attendedAt?: string;
  invitedBy?: {
    name: string;
    church: string;
  };
}

// Mock event data
const eventData = {
  id: "evt-001",
  title: "Spiritual Empowerment Day 1",
  date: "March 15, 2026",
  location: "Los Angeles Convention Center",
  totalRegistrations: 156,
  checkedIn: 89,
  hasBaptism: true,
};

// Mock guest data
const mockGuests: Guest[] = [
  {
    id: "g1",
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    status: "registered",
    inviteCode: "ABC123",
    registeredAt: "2026-03-01T10:30:00",
    invitedBy: { name: "Pastor James", church: "LA Central Church" },
  },
  {
    id: "g2",
    name: "Jane Smith",
    email: "jane.smith@email.com",
    phone: "+1 (555) 987-6543",
    status: "attended",
    inviteCode: "DEF456",
    registeredAt: "2026-03-02T14:15:00",
    attendedAt: "2026-03-15T09:05:00",
    invitedBy: { name: "Brother Mike", church: "SF Bay Church" },
  },
  {
    id: "g3",
    name: "Robert Johnson",
    email: "robert.j@email.com",
    phone: "+1 (555) 456-7890",
    status: "baptized",
    inviteCode: "GHI789",
    registeredAt: "2026-03-03T09:00:00",
    attendedAt: "2026-03-15T08:45:00",
    invitedBy: { name: "Sister Mary", church: "SD South Church" },
  },
];

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentCheckIns, setRecentCheckIns] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    message: string;
    guest?: Guest;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (scanMode === "manual" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const playSound = (type: "success" | "error") => {
    if (!soundEnabled) return;
    // Would play actual sound in production
    console.log(`Playing ${type} sound`);
  };

  const handleCheckIn = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    // Find guest by invite code
    const guest = mockGuests.find(g => g.inviteCode.toUpperCase() === cleanCode);

    if (!guest) {
      playSound("error");
      setCheckInResult({
        success: false,
        message: "Invalid code. Guest not found.",
      });
      return;
    }

    if (guest.status === "attended" || guest.status === "baptized") {
      playSound("error");
      setCheckInResult({
        success: false,
        message: "Guest already checked in.",
        guest,
      });
      return;
    }

    // Successful check-in
    playSound("success");
    const updatedGuest = {
      ...guest,
      status: "attended" as const,
      attendedAt: new Date().toISOString(),
    };

    setCheckInResult({
      success: true,
      message: "Check-in successful!",
      guest: updatedGuest,
    });

    setRecentCheckIns(prev => [updatedGuest, ...prev.slice(0, 9)]);
    setManualCode("");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(manualCode);
  };

  const handleMarkBaptized = (guest: Guest) => {
    const updatedGuest = { ...guest, status: "baptized" as const };
    setSelectedGuest(updatedGuest);
    // Would update in database
    console.log("Marked as baptized:", guest.id);
  };

  const filteredGuests = mockGuests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.inviteCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-700">
                <Link href="/dashboard/events">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{eventData.title}</h1>
                <p className="text-sm text-slate-400">{eventData.date} • {eventData.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-slate-700"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-white font-bold">{eventData.checkedIn}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-300">{eventData.totalRegistrations}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={scanMode === "manual" ? "default" : "outline"}
                onClick={() => setScanMode("manual")}
                className={scanMode === "manual" ? "" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
              <Button
                variant={scanMode === "camera" ? "default" : "outline"}
                onClick={() => setScanMode("camera")}
                className={scanMode === "camera" ? "" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera Scan
              </Button>
            </div>

            {/* Scanner Area */}
            <Card className="bg-slate-800 border-slate-700 p-8">
              {scanMode === "manual" ? (
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-2">Enter Invite Code</h2>
                  <p className="text-slate-400 mb-6">
                    Type the guest's invite code from their QR code or confirmation
                  </p>
                  <form onSubmit={handleManualSubmit} className="max-w-md mx-auto">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="Enter code (e.g., ABC123)"
                        className="bg-slate-700 border-slate-600 text-white text-center text-2xl tracking-widest uppercase"
                        maxLength={10}
                      />
                      <Button type="submit" size="lg" disabled={!manualCode.trim()}>
                        Check In
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center">
                  <div className="aspect-video max-w-lg mx-auto bg-slate-900 rounded-lg flex items-center justify-center mb-6">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Camera access required</p>
                      <Button variant="outline" className="mt-4 bg-slate-800 border-slate-700 text-white">
                        Enable Camera
                      </Button>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Point camera at guest's QR code to automatically check them in
                  </p>
                </div>
              )}
            </Card>

            {/* Check-in Result */}
            {checkInResult && (
              <Card className={`p-6 ${
                checkInResult.success
                  ? "bg-green-900/50 border-green-700"
                  : "bg-red-900/50 border-red-700"
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    checkInResult.success ? "bg-green-500" : "bg-red-500"
                  }`}>
                    {checkInResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${
                      checkInResult.success ? "text-green-400" : "text-red-400"
                    }`}>
                      {checkInResult.message}
                    </h3>
                    {checkInResult.guest && (
                      <div className="mt-2">
                        <p className="text-white text-lg">{checkInResult.guest.name}</p>
                        <p className="text-slate-400 text-sm">{checkInResult.guest.email}</p>
                        {checkInResult.guest.invitedBy && (
                          <p className="text-slate-400 text-sm mt-1">
                            Invited by {checkInResult.guest.invitedBy.name} • {checkInResult.guest.invitedBy.church}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {checkInResult.success && eventData.hasBaptism && checkInResult.guest?.status !== "baptized" && (
                    <Button
                      variant="outline"
                      className="bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
                      onClick={() => checkInResult.guest && handleMarkBaptized(checkInResult.guest)}
                    >
                      Mark Baptized
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCheckInResult(null)}
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
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700">
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
                  {recentCheckIns.map((guest, index) => (
                    <div key={`${guest.id}-${index}`} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{guest.name}</p>
                        <p className="text-slate-400 text-sm">{guest.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          guest.status === "baptized"
                            ? "bg-purple-500"
                            : "bg-green-500"
                        }>
                          {guest.status}
                        </Badge>
                        {guest.attendedAt && (
                          <p className="text-slate-400 text-xs mt-1">
                            {new Date(guest.attendedAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit"
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Guest List Sidebar */}
          <div className="space-y-6">
            {/* Search */}
            <Card className="bg-slate-800 border-slate-700 p-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800 border-slate-700 p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{eventData.checkedIn}</p>
                <p className="text-slate-400 text-sm">Checked In</p>
              </Card>
              <Card className="bg-slate-800 border-slate-700 p-4 text-center">
                <p className="text-3xl font-bold text-orange-400">
                  {eventData.totalRegistrations - eventData.checkedIn}
                </p>
                <p className="text-slate-400 text-sm">Pending</p>
              </Card>
            </div>

            {/* Guest List */}
            <Card className="bg-slate-800 border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-4">Registered Guests</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredGuests.map(guest => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => setSelectedGuest(guest)}
                    className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          guest.status === "registered"
                            ? "bg-slate-600"
                            : guest.status === "baptized"
                            ? "bg-purple-500"
                            : "bg-green-500"
                        }`}>
                          {guest.status === "registered" ? (
                            <User className="w-4 h-4 text-slate-300" />
                          ) : (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{guest.name}</p>
                          <p className="text-slate-400 text-xs">{guest.inviteCode}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        guest.status === "registered"
                          ? "border-slate-500 text-slate-400"
                          : guest.status === "baptized"
                          ? "border-purple-500 text-purple-400"
                          : "border-green-500 text-green-400"
                      }>
                        {guest.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Guest Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedGuest(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">{selectedGuest.name}</h3>
                    <Badge className={
                      selectedGuest.status === "registered"
                        ? "bg-slate-600"
                        : selectedGuest.status === "baptized"
                        ? "bg-purple-500"
                        : "bg-green-500"
                    }>
                      {selectedGuest.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{selectedGuest.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{selectedGuest.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <QrCode className="w-4 h-4 text-slate-500" />
                    <span className="font-mono">{selectedGuest.inviteCode}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Registered {new Date(selectedGuest.registeredAt).toLocaleDateString()}</span>
                  </div>
                  {selectedGuest.invitedBy && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Invited by {selectedGuest.invitedBy.name} ({selectedGuest.invitedBy.church})</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedGuest.status === "registered" && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleCheckIn(selectedGuest.inviteCode);
                        setSelectedGuest(null);
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Check In
                    </Button>
                  )}
                  {(selectedGuest.status === "attended" || selectedGuest.status === "registered") && eventData.hasBaptism && (
                    <Button
                      variant="outline"
                      className="flex-1 bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
                      onClick={() => {
                        handleMarkBaptized(selectedGuest);
                      }}
                    >
                      Mark Baptized
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
