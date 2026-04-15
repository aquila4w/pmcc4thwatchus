"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
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
  Heart,
  Church,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface EventData {
  invite: {
    id: string;
    inviteCode: string;
  };
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
    spotsRemaining: number | null;
    isFull: boolean;
    isPastDeadline: boolean;
    landingPage: {
      title: string;
      showQR: boolean;
      showInviter: boolean;
    };
  };
  invitedBy: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    church?: string;
  };
  registrationCount: number;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface RegistrationResult {
  id: string;
  code: string;
  qrCodeUrl: string;
  landingPageUrl: string;
  ticketUrl: string;
  status: string;
  isWaitlisted?: boolean;
  waitlistPosition?: number;
}

type Step = "loading" | "form" | "submitting" | "success" | "error" | "closed" | "waitlist";

export default function RegisterPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const inviteCode = searchParams.get("invite");
  const adCode = searchParams.get("ad");

  // Support ?ref=, ?invite=, and ?ad= params
  const code = refCode || inviteCode || adCode;

  const [step, setStep] = useState<Step>("loading");
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [inviteType, setInviteType] = useState<"member" | "church">("member");
  const captchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!code) {
        setErrorMessage("Invalid invite link. Please use the link shared by a church member.");
        setStep("error");
        return;
      }

      try {
        let data: EventData;

        if (adCode) {
          // Church ad QR code lookup
          setInviteType("church");
          const response = await fetch(`/api/church-invite/${encodeURIComponent(adCode)}`);
          if (!response.ok) throw new Error("Invalid or disabled church invite code");
          const churchData = await response.json();

          // Map church invite response to EventData interface
          data = {
            invite: { id: churchData.churchInvite.id, inviteCode: churchData.churchInvite.code },
            event: churchData.event,
            invitedBy: {
              id: "",
              name: churchData.contact?.name || churchData.church?.name || "",
              phone: churchData.contact?.phone || undefined,
              email: churchData.contact?.email || undefined,
              church: churchData.church?.name || undefined,
            },
            registrationCount: churchData.registrationCount || 0,
          };
        } else if (refCode) {
          // Look up by member code + event slug
          const response = await fetch(`/api/event-invite/by-ref?code=${encodeURIComponent(refCode)}&eventSlug=${encodeURIComponent(resolvedParams.eventSlug)}`);
          if (!response.ok) throw new Error("Invalid or expired invite link");
          data = await response.json();
        } else {
          // Look up by event-invite UUID
          const response = await fetch(`/api/event-invite/${encodeURIComponent(inviteCode!)}`);
          if (!response.ok) throw new Error("Invalid or expired invite link");
          data = await response.json();
        }

        setEventData(data);

        // Record scan (fire-and-forget)
        fetch("/api/invite-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteType,
            inviteCode: adCode || code,
            event: data.event.id,
            eventInvite: !adCode ? data.invite?.id || undefined : undefined,
            churchEventInvite: adCode ? data.invite?.id : undefined,
          }),
        })
          .then((res) => res.json())
          .then((scanResult) => {
            if (scanResult.scanId) setScanId(scanResult.scanId);
          })
          .catch(() => {
            // Non-critical — scan recording failure shouldn't block the page
          });

        if (data.event.isFull || data.event.isPastDeadline) {
          setStep("closed");
        } else {
          setStep("form");
        }
      } catch {
        setErrorMessage("Could not load event details. Please try again later or contact the person who invited you.");
        setStep("error");
      }
    };

    fetchEvent();
  }, [code, refCode, inviteCode, adCode, inviteType, resolvedParams.eventSlug]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Please enter a valid mobile number";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      setErrorMessage("Please complete the captcha verification");
      return false;
    }

    setErrors(newErrors);
    setErrorMessage("");
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, joinWaitlist = false) => {
    e.preventDefault();
    if (!validateForm() || !code) return;

    setStep("submitting");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventInviteCode: !adCode ? (eventData?.invite?.inviteCode || code) : undefined,
          eventSlug: resolvedParams.eventSlug,
          refCode: refCode || undefined,
          adCode: adCode || undefined,
          scanId: scanId || undefined,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          recaptchaToken: captchaToken,
          joinWaitlist,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.capacityReached && data.canJoinWaitlist) {
          setErrorMessage(`Event is at full capacity. ${data.waitlistCount} people are on the waitlist. Would you like to join?`);
          setStep("waitlist");
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      setRegistrationResult({
        id: data.registration.id,
        code: data.registration.code,
        qrCodeUrl: data.registration.qrCodeUrl,
        landingPageUrl: data.registration.landingPageUrl,
        ticketUrl: data.registration.ticketUrl,
        status: data.registration.status,
        isWaitlisted: data.isWaitlisted,
        waitlistPosition: data.waitlistPosition,
      });
      setStep("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setStep("error");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // --- RENDER STATES ---

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

  if (step === "closed" && eventData) {
    return (
      <div className="min-h-screen bg-[#0a0f1a]">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto bg-white/5 border-white/10 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-white mb-2">Registration Closed</h1>
            <p className="text-white/60 mb-4">
              Registration for <strong className="text-white">{eventData.event.title}</strong> is currently closed.
            </p>
            {eventData.event.isFull && <p className="text-orange-400 text-sm mb-6">This event has reached maximum capacity.</p>}
            {eventData.event.isPastDeadline && <p className="text-orange-400 text-sm mb-6">Registration deadline has passed.</p>}
            <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
              <Link href="/"><Home className="w-4 h-4 mr-2" />Back to Home</Link>
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-[#0a0f1a]">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto bg-white/5 border-white/10 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-white mb-2">Something Went Wrong</h1>
            <p className="text-white/60 mb-6">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10" onClick={() => window.location.reload()}>Try Again</Button>
              <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                <Link href="/"><Home className="w-4 h-4 mr-2" />Back to Home</Link>
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!eventData) return null;

  const guestFullName = `${formData.firstName} ${formData.lastName}`.trim();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Event Hero */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <div className="aspect-[21/9] relative bg-gradient-to-br from-primary to-primary/60">
              {eventData.event.heroImageUrl && (
                <img src={eventData.event.heroImageUrl} alt={eventData.event.title} className="w-full h-full object-cover" />
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
                <span className="flex items-center gap-2"><Calendar className="w-5 h-5" />{formatDate(eventData.event.startDate)}</span>
                <span className="flex items-center gap-2"><Clock className="w-5 h-5" />{formatTime(eventData.event.startDate)}</span>
                <span className="flex items-center gap-2"><MapPin className="w-5 h-5" />{eventData.event.location}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Event Details + Inviter */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/5 border-white/10 p-6">
                <h2 className="font-serif text-xl font-semibold text-white mb-4">About This Event</h2>
                <p className="text-white/60 leading-relaxed mb-6">{eventData.event.description}</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-medium">{eventData.event.location}</p>
                      <p className="text-white/50 text-sm">{eventData.event.address}</p>
                    </div>
                  </div>
                  {eventData.event.spotsRemaining !== null && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-secondary" />
                      <p className="text-white/70">
                        <span className="text-white font-bold">{eventData.event.spotsRemaining}</span> spots remaining
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Invited By / Sponsored By Card */}
              {eventData.invitedBy && eventData.event.landingPage.showInviter && (
                <Card className="bg-secondary/10 border-secondary/20 p-6">
                  <h2 className="font-serif text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    {adCode ? (
                      <>
                        <Church className="w-5 h-5 text-secondary" />
                        Sponsored By
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 text-secondary" />
                        You&apos;ve Been Invited By
                      </>
                    )}
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
                      <User className="w-7 h-7 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-lg font-semibold">{eventData.invitedBy.name}</p>
                      {eventData.invitedBy.church && (
                        <p className="text-white/60 text-sm flex items-center gap-1">
                          <Church className="w-4 h-4" />{eventData.invitedBy.church}
                        </p>
                      )}
                      {eventData.invitedBy.phone && (
                        <p className="text-secondary text-sm flex items-center gap-1 mt-1">
                          <Phone className="w-4 h-4" />{eventData.invitedBy.phone}
                        </p>
                      )}
                      {eventData.invitedBy.email && (
                        <p className="text-secondary text-sm flex items-center gap-1">
                          <Mail className="w-4 h-4" />{eventData.invitedBy.email}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Registration Form / Success */}
            <div className="lg:col-span-3">
              <Card className="bg-white/5 border-white/10 p-6 md:p-8">
                {step === "form" && (
                  <>
                    <h2 className="font-serif text-2xl font-semibold text-white mb-2">RSVP for This Event</h2>
                    <p className="text-white/50 mb-6">Fill out the form below to secure your spot</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-white mb-2 block">First Name *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange}
                              placeholder="First name"
                              className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 ${errors.firstName ? "border-red-500" : ""}`} />
                          </div>
                          {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-white mb-2 block">Last Name *</Label>
                          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange}
                            placeholder="Last name"
                            className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 ${errors.lastName ? "border-red-500" : ""}`} />
                          {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-white mb-2 block">Mobile Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                            placeholder="+1 (555) 000-0000"
                            className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 ${errors.phone ? "border-red-500" : ""}`} />
                        </div>
                        {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-white mb-2 block">
                          Email Address <span className="text-white/40">(optional)</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange}
                            placeholder="you@example.com"
                            className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 ${errors.email ? "border-red-500" : ""}`} />
                        </div>
                        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                      </div>

                      {/* reCAPTCHA */}
                      {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                        <div className="flex justify-center">
                          <ReCAPTCHA
                            ref={captchaRef}
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                            theme="dark"
                            onChange={(token) => setCaptchaToken(token)}
                            onExpired={() => setCaptchaToken(null)}
                          />
                        </div>
                      )}

                      {errorMessage && (
                        <p className="text-red-400 text-sm text-center">{errorMessage}</p>
                      )}

                      <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-[#0a0f1a] font-bold py-6">
                        Submit RSVP <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>

                      <p className="text-white/40 text-xs text-center leading-relaxed">
                        By submitting your RSVP, you consent to the collection and use of your personal information
                        in accordance with our{" "}
                        <Link href="/privacy-policy" target="_blank" className="text-secondary underline hover:text-secondary/80">
                          Data Privacy Policy
                        </Link>.
                      </p>
                    </form>
                  </>
                )}

                {step === "submitting" && (
                  <div className="py-16 text-center">
                    <Loader2 className="w-16 h-16 text-secondary animate-spin mx-auto mb-6" />
                    <h2 className="font-serif text-2xl font-semibold text-white mb-2">Processing Registration</h2>
                    <p className="text-white/50">Please wait while we confirm your registration...</p>
                  </div>
                )}

                {step === "waitlist" && (
                  <div className="py-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-orange-400" />
                    </div>
                    <h2 className="font-serif text-2xl font-semibold text-white mb-2">Event at Full Capacity</h2>
                    <p className="text-white/60 mb-6">{errorMessage}</p>
                    <div className="flex flex-col gap-3">
                      <Button onClick={(e) => handleSubmit(e, true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4">
                        <Users className="w-5 h-5 mr-2" />Join Waitlist
                      </Button>
                      <Button variant="outline" onClick={() => setStep("form")} className="bg-white/5 border-white/20 text-white hover:bg-white/10">Go Back</Button>
                    </div>
                    <p className="text-white/40 text-xs mt-4">You&apos;ll be notified if a spot becomes available</p>
                  </div>
                )}

                {step === "success" && registrationResult && (
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${registrationResult.isWaitlisted ? "bg-orange-500/20" : "bg-green-500/20"}`}>
                      {registrationResult.isWaitlisted ? <Users className="w-10 h-10 text-orange-400" /> : <CheckCircle2 className="w-10 h-10 text-green-400" />}
                    </div>
                    <h2 className="font-serif text-2xl font-semibold text-white mb-2">
                      {registrationResult.isWaitlisted ? "Added to Waitlist!" : "You're Registered!"}
                    </h2>
                    <p className="text-white/50 mb-6">
                      {registrationResult.isWaitlisted
                        ? `Thank you, ${guestFullName}! You're #${registrationResult.waitlistPosition} on the waitlist.`
                        : `Thank you, ${guestFullName}! You're all set for the event.`}
                    </p>

                    {/* QR Code Section */}
                    {eventData.event.landingPage.showQR && (
                      <>
                        <div className="bg-white rounded-xl p-6 inline-block mb-4">
                          <img src={registrationResult.qrCodeUrl} alt="Your QR Code" className="w-48 h-48 mx-auto" />
                          <p className="text-[#0a0f1a] font-mono text-xl mt-4 font-bold tracking-widest">{registrationResult.code}</p>
                          <p className="text-gray-500 text-xs mt-1">Manual entry code (if scanning is not possible)</p>
                        </div>

                        {/* Event recap */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 text-left">
                          <h3 className="text-white font-semibold mb-2">{eventData.event.title}</h3>
                          <div className="flex flex-wrap gap-3 text-white/70 text-sm">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(eventData.event.startDate)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(eventData.event.startDate)}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{eventData.event.location}</span>
                          </div>
                        </div>

                        {/* Notification info */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                          <p className="text-white/70 text-sm">
                            <strong className="text-white">Save this QR code!</strong> Present it at the event check-in.
                            {formData.phone && (<> We&apos;ve sent an SMS to <strong className="text-white">{formData.phone}</strong>.</>)}
                            {formData.email && (<> We&apos;ve also sent a confirmation email to <strong className="text-white">{formData.email}</strong>.</>)}
                          </p>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {eventData.event.landingPage.showQR && (
                        <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = registrationResult.qrCodeUrl;
                            link.download = `registration-${registrationResult.code}.png`;
                            link.click();
                          }}>
                          <Download className="w-4 h-4 mr-2" />Save QR Code
                        </Button>
                      )}
                      <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                        <Link href={registrationResult.landingPageUrl}>
                          <QrCode className="w-4 h-4 mr-2" />View My Ticket
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8">
          <p className="text-white/30 text-sm text-center">
            &copy; {new Date().getFullYear()} Pentecostal Missionary Church of Christ (4th Watch). All rights reserved.
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
