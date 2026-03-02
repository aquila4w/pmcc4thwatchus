"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Heart,
  Clock,
  CheckCircle2,
  Loader2,
  Facebook,
  Youtube
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type: "general" | "prayer";
  isPrivate: boolean;
}

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "info@pmcc4thwatch.us",
    link: "mailto:info@pmcc4thwatch.us",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "(555) 123-4567",
    link: "tel:+15551234567",
  },
  {
    icon: MapPin,
    title: "US District Office",
    value: "United States",
    link: "/locate",
  },
  {
    icon: Clock,
    title: "Office Hours",
    value: "Mon-Fri: 9AM - 5PM PST",
    link: null,
  },
];

const socialLinks = [
  {
    icon: Facebook,
    title: "Facebook",
    link: "https://www.facebook.com/pmcc4thwatchusdistrict",
  },
  {
    icon: Youtube,
    title: "YouTube",
    link: "https://www.youtube.com/@SurerWord",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    type: "general",
    isPrivate: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      type: "general",
      isPrivate: false,
    });
    setIsSubmitted(false);
    setErrors({});
  };

  return (
    <main className="min-h-screen bg-[#f8f6f3]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#0a0f1a] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
              Get In Touch
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6">
              Contact
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                Us
              </span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl">
              We'd love to hear from you. Whether you have questions, need prayer,
              or want to connect with our community, we're here for you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-[#0a0f1a] mb-4">
                      {formData.type === "prayer" ? "Prayer Request Received" : "Message Sent"}
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      {formData.type === "prayer"
                        ? "Thank you for sharing your prayer request with us. Our prayer team will be lifting you up in prayer."
                        : "Thank you for reaching out. We'll get back to you as soon as possible."}
                    </p>
                    <Button onClick={resetForm}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <Tabs defaultValue="general" className="w-full" onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as "general" | "prayer" }))}>
                      <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          General Inquiry
                        </TabsTrigger>
                        <TabsTrigger value="prayer" className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Prayer Request
                        </TabsTrigger>
                      </TabsList>

                      <form onSubmit={handleSubmit}>
                        <TabsContent value="general" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="name">Full Name *</Label>
                              <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Your name"
                                className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                              />
                              {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="email">Email Address *</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="you@example.com"
                                className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                              />
                              {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="(555) 123-4567"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="subject">Subject</Label>
                              <Input
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                placeholder="How can we help?"
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                              id="message"
                              name="message"
                              value={formData.message}
                              onChange={handleInputChange}
                              placeholder="Your message..."
                              className={`mt-1 min-h-[150px] ${errors.message ? "border-red-500" : ""}`}
                            />
                            {errors.message && (
                              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="prayer" className="space-y-6">
                          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 mb-6">
                            <p className="text-sm text-[#0a0f1a]">
                              <strong>Our Prayer Team</strong> is committed to praying for you.
                              Share your prayer request and we will lift you up before the Lord.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="prayer-name">Your Name *</Label>
                              <Input
                                id="prayer-name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Your name"
                                className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                              />
                              {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="prayer-email">Email Address *</Label>
                              <Input
                                id="prayer-email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="you@example.com"
                                className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                              />
                              {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="prayer-message">Prayer Request *</Label>
                            <Textarea
                              id="prayer-message"
                              name="message"
                              value={formData.message}
                              onChange={handleInputChange}
                              placeholder="Share your prayer request..."
                              className={`mt-1 min-h-[180px] ${errors.message ? "border-red-500" : ""}`}
                            />
                            {errors.message && (
                              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="isPrivate"
                              name="isPrivate"
                              checked={formData.isPrivate}
                              onChange={handleInputChange}
                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isPrivate" className="cursor-pointer text-sm">
                              Keep my prayer request private (only leadership will see)
                            </Label>
                          </div>
                        </TabsContent>

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full mt-6 bg-secondary hover:bg-secondary/90 text-[#0a0f1a]"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              {formData.type === "prayer" ? "Submit Prayer Request" : "Send Message"}
                            </>
                          )}
                        </Button>
                      </form>
                    </Tabs>
                  </>
                )}
              </Card>
            </motion.div>

            {/* Contact Info Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Contact Information */}
              <Card className="p-6">
                <h3 className="font-serif text-lg font-bold text-[#0a0f1a] mb-6">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-[#0a0f1a]">{item.title}</p>
                        {item.link ? (
                          <a
                            href={item.link}
                            className="text-muted-foreground hover:text-primary transition-colors text-sm"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-muted-foreground text-sm">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Social Links */}
              <Card className="p-6">
                <h3 className="font-serif text-lg font-bold text-[#0a0f1a] mb-6">
                  Follow Us
                </h3>
                <div className="flex gap-3">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </Card>

              {/* Find a Church */}
              <Card className="p-6 bg-gradient-to-br from-secondary/10 to-primary/10 border-secondary/20">
                <h3 className="font-serif text-lg font-bold text-[#0a0f1a] mb-3">
                  Visit Us In Person
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Find a PMCC 4th Watch church near you and experience our community firsthand.
                </p>
                <Button asChild className="w-full bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                  <Link href="/locate">
                    <MapPin className="w-4 h-4 mr-2" />
                    Find a Church
                  </Link>
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
