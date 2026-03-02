"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  User,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
  QrCode,
  Download,
  Share2,
  Home,
  AlertCircle,
  Users,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PuckRenderer } from "@/components/PuckRenderer";
import type { Data } from "@measured/puck";

interface EventData {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    location: string;
    address: string;
    heroImageUrl: string | null;
    hasBaptism: boolean;
    eventType: string;
    contentMode?: "richtext" | "blocks" | "puck";
    puckData?: Data | null;
  };
  registration: {
    isOpen: boolean;
    spotsRemaining: number | null;
    totalRegistrations: number;
    maxAttendees: number | null;
    deadline: string | null;
  };
  invitedBy: {
    name: string;
    phone: string;
    church: string | null;
  } | null;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
}

interface RegistrationResult {
  code: string;
  qrCodeUrl: string;
  ticketUrl: string;
  isWaitlisted?: boolean;
  waitlistPosition?: number;
}

type Step = "loading" | "form" | "submitting" | "success" | "error" | "closed" | "waitlist";

export default function RegisterPage({ params }: { params: Promise<{ eventSlug: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const memberCode = searchParams.get("ref");

  const [step, setStep] = useState<Step>("loading");
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fetch event data on mount
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const url = memberCode
          ? `/api/events/${resolvedParams.eventSlug}?ref=${memberCode}`
          : `/api/events/${resolvedParams.eventSlug}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Event not found");
        }

        const data = await response.json();
        setEventData(data);

        if (!data.registration.isOpen) {
          setStep("closed");
        } else if (!memberCode) {
          setErrorMessage("Invalid invite link. Please use the link shared by a church member.");
          setStep("error");
        } else if (!data.invitedBy) {
          setErrorMessage("Invalid invite code. The member who shared this link could not be found.");
          setStep("error");
        } else {
          setStep("form");
        }
      } catch (error) {
        setErrorMessage("Could not load event details. Please try again later.");
        setStep("error");
      }
    };

    fetchEvent();
  }, [resolvedParams.eventSlug, memberCode]);

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, joinWaitlist = false) => {
    e.preventDefault();

    if (!validateForm() || !memberCode) return;

    setStep("submitting");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventSlug: resolvedParams.eventSlug,
          memberInviteCode: memberCode,
          guestName: formData.name,
          guestEmail: formData.email || undefined,
          guestPhone: formData.phone || undefined,
          joinWaitlist,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is a capacity reached response with waitlist option
        if (data.capacityReached && data.canJoinWaitlist) {
          setErrorMessage(`Event is at full capacity. ${data.waitlistCount} people are on the waitlist. Would you like to join?`);
          setStep("waitlist");
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      setRegistrationResult({
        code: data.registration.code,
        qrCodeUrl: data.registration.qrCodeUrl,
        ticketUrl: data.registration.ticketUrl,
        isWaitlisted: data.isWaitlisted,
        waitlistPosition: data.waitlistPosition,
      });
      setStep("success");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Registration failed. Please try again.";
      setErrorMessage(errorMsg);
      setStep("error");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Registration closed
  if (step === "closed" && eventData) {
    return (
      <div className="min-h-screen bg-[#0a0f1a]">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto bg-white/5 border-white/10 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-white mb-2">
              Registration Closed
            </h1>
            <p className="text-white/60 mb-4">
              Registration for <strong className="text-white">{eventData.event.title}</strong> is currently closed.
            </p>
            {eventData.registration.spotsRemaining === 0 && (
              <p className="text-orange-400 text-sm mb-6">
                This event has reached maximum capacity.
              </p>
            )}
            <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div className="min-h-screen bg-[#0a0f1a]">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto bg-white/5 border-white/10 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-white mb-2">
              Something Went Wrong
            </h1>
            <p className="text-white/60 mb-6">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
              <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!eventData) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Event Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden mb-8"
          >
            <div className="aspect-[21/9] relative bg-gradient-to-br from-primary to-primary/60">
              {eventData.event.heroImageUrl && (
                <img
                  src={eventData.event.heroImageUrl}
                  alt={eventData.event.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/50 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <span className="inline-block px-3 py-1 bg-secondary text-[#0a0f1a] text-sm font-bold rounded-full mb-4">
                {eventData.event.eventType.replace("-", " ").toUpperCase()}
              </span>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {eventData.event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-white/70">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {formatDate(eventData.event.startDate)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {formatTime(eventData.event.startDate)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {eventData.event.location}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Event Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              <Card className="bg-white/5 border-white/10 p-6">
                <h2 className="font-serif text-xl font-semibold text-white mb-4">
                  About This Event
                </h2>
                <p className="text-white/60 leading-relaxed mb-6">
                  {eventData.event.description}
                </p>

                {/* Puck Visual Content */}
                {eventData.event.contentMode === "puck" && eventData.event.puckData && (
                  <div className="mb-6 bg-white rounded-xl overflow-hidden">
                    <PuckRenderer data={eventData.event.puckData} />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-medium">{eventData.event.location}</p>
                      <p className="text-white/50 text-sm">{eventData.event.address}</p>
                    </div>
                  </div>
                  {eventData.registration.spotsRemaining !== null && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-secondary" />
                      <p className="text-white/70">
                        <span className="text-white font-bold">{eventData.registration.spotsRemaining}</span> spots remaining
                      </p>
                    </div>
                  )}
                  {eventData.event.hasBaptism && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <p className="text-purple-300 text-sm">
                        This event includes a baptism ceremony. If you're interested, please let the staff know at the event.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Invited By Card */}
              {eventData.invitedBy && (
                <Card className="bg-secondary/10 border-secondary/20 p-6">
                  <h2 className="font-serif text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-secondary" />
                    You've Been Invited By
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
                      <User className="w-7 h-7 text-secondary" />
                    </div>
                    <div>
                      <p className="text-white text-lg font-semibold">{eventData.invitedBy.name}</p>
                      {eventData.invitedBy.church && (
                        <p className="text-white/60 text-sm">{eventData.invitedBy.church}</p>
                      )}
                      {eventData.invitedBy.phone && (
                        <p className="text-secondary text-sm flex items-center gap-1 mt-1">
                          <Phone className="w-4 h-4" />
                          {eventData.invitedBy.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>

            {/* Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-3"
            >
              <Card className="bg-white/5 border-white/10 p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {step === "form" && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h2 className="font-serif text-2xl font-semibold text-white mb-2">
                        Register for This Event
                      </h2>
                      <p className="text-white/50 mb-6">
                        Fill out the form below to secure your spot
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                          <Label htmlFor="name" className="text-white mb-2 block">
                            Full Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Enter your full name"
                              className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 ${
                                errors.name ? "border-red-500" : ""
                              }`}
                            />
                          </div>
                          {errors.name && (
                            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-white mb-2 block">
                            Email Address <span className="text-white/40">(for confirmation)</span>
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="you@example.com"
                              className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 ${
                                errors.email ? "border-red-500" : ""
                              }`}
                            />
                          </div>
                          {errors.email && (
                            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="phone" className="text-white mb-2 block">
                            Phone Number <span className="text-white/40">(for ticket link)</span>
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="+1 (555) 000-0000"
                              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-secondary hover:bg-secondary/90 text-[#0a0f1a] font-bold py-6"
                        >
                          Register Now
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>

                        <p className="text-white/40 text-xs text-center">
                          By registering, you agree to receive event updates via email and SMS
                        </p>
                      </form>
                    </motion.div>
                  )}

                  {step === "submitting" && (
                    <motion.div
                      key="submitting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-16 text-center"
                    >
                      <Loader2 className="w-16 h-16 text-secondary animate-spin mx-auto mb-6" />
                      <h2 className="font-serif text-2xl font-semibold text-white mb-2">
                        Processing Registration
                      </h2>
                      <p className="text-white/50">
                        Please wait while we confirm your registration...
                      </p>
                    </motion.div>
                  )}

                  {step === "waitlist" && (
                    <motion.div
                      key="waitlist"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8 text-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-orange-400" />
                      </div>
                      <h2 className="font-serif text-2xl font-semibold text-white mb-2">
                        Event at Full Capacity
                      </h2>
                      <p className="text-white/60 mb-6">
                        {errorMessage}
                      </p>
                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={(e) => handleSubmit(e, true)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4"
                        >
                          <Users className="w-5 h-5 mr-2" />
                          Join Waitlist
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setStep("form")}
                          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                          Go Back
                        </Button>
                      </div>
                      <p className="text-white/40 text-xs mt-4">
                        You'll be notified if a spot becomes available
                      </p>
                    </motion.div>
                  )}

                  {step === "success" && registrationResult && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                        registrationResult.isWaitlisted ? "bg-orange-500/20" : "bg-green-500/20"
                      }`}>
                        {registrationResult.isWaitlisted ? (
                          <Users className="w-10 h-10 text-orange-400" />
                        ) : (
                          <CheckCircle2 className="w-10 h-10 text-green-400" />
                        )}
                      </div>
                      <h2 className="font-serif text-2xl font-semibold text-white mb-2">
                        {registrationResult.isWaitlisted ? "Added to Waitlist!" : "Registration Successful!"}
                      </h2>
                      <p className="text-white/50 mb-8">
                        {registrationResult.isWaitlisted
                          ? `Thank you, ${formData.name}! You're #${registrationResult.waitlistPosition} on the waitlist.`
                          : `Thank you, ${formData.name}! You're all set for the event.`
                        }
                      </p>

                      {/* QR Code */}
                      <div className="bg-white rounded-xl p-6 inline-block mb-6">
                        <img
                          src={registrationResult.qrCodeUrl}
                          alt="Your QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                        <p className="text-[#0a0f1a] font-mono text-lg mt-4 font-bold">
                          {registrationResult.code}
                        </p>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                        <p className="text-white/70 text-sm">
                          <strong className="text-white">Save this QR code!</strong> Present it at the event check-in.
                          {formData.email && (
                            <> We've also sent a confirmation to <strong className="text-white">{formData.email}</strong></>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          variant="outline"
                          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = registrationResult.qrCodeUrl;
                            link.download = `ticket-${registrationResult.code}.png`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Save QR Code
                        </Button>
                        <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                          <Link href={`/ticket/${registrationResult.code}`}>
                            <QrCode className="w-4 h-4 mr-2" />
                            View My Ticket
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8">
          <p className="text-white/30 text-sm text-center">
            © {new Date().getFullYear()} Pentecostal Missionary Church of Christ (4th Watch). All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-[#0a0f1a] border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/10">
            <span className="text-secondary font-serif font-bold text-sm">P</span>
          </div>
          <div>
            <span className="text-white font-serif text-lg font-semibold">PMCC</span>
            <span className="text-white/50 text-xs block tracking-[0.2em] uppercase">4th Watch</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
