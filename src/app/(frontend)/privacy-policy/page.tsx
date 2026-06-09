"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-[#0a0f1a] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/30 rounded-full px-4 py-2 mb-6">
                <Shield className="w-4 h-4 text-secondary" />
                <span className="text-secondary text-sm font-medium">Your Privacy Matters</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
                Privacy Policy
              </h1>
              <p className="text-white/60 text-lg">
                Last updated: June 2026
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg dark:prose-invert max-w-none"
            >
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-8 md:p-12 shadow-sm">
                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Introduction
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  Pentecostal Missionary Church of Christ (4th Watch) US District ("we," "our," or "us")
                  respects your privacy and is committed to protecting your personal information. This
                  Privacy Policy explains how we collect, use, disclose, and safeguard your information
                  when you visit our website or interact with our services.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Information We Collect
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  We may collect information about you in a variety of ways, including:
                </p>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-8 space-y-2">
                  <li>
                    <strong>Personal Data:</strong> Name, email address, phone number, and other contact
                    information you voluntarily provide when filling out forms, making donations, or
                    contacting us.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Information about how you access and use our website,
                    including your IP address, browser type, pages visited, and time spent on pages.
                  </li>
                  <li>
                    <strong>Prayer Requests:</strong> Information you share in prayer request submissions.
                  </li>
                  <li>
                    <strong>Third-Party Login Data:</strong> When you choose to sign in using Facebook,
                    Google, or other third-party authentication providers, we receive your public profile
                    information (such as your name and email address) from that provider. We use this
                    information solely to create and manage your account. We do not post to your social
                    media accounts or share your login data with any other parties.
                  </li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  How We Use Your Information
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-8 space-y-2">
                  <li>Provide and maintain our website and services</li>
                  <li>Process donations and send receipts</li>
                  <li>Respond to your inquiries and prayer requests</li>
                  <li>Send newsletters and updates about church activities (with your consent)</li>
                  <li>Improve our website and user experience</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Information Sharing
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  We do not sell, trade, or rent your personal information to third parties. We may share
                  your information only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-8 space-y-2">
                  <li>With your consent</li>
                  <li>To comply with legal requirements</li>
                  <li>To protect our rights and safety</li>
                  <li>With service providers who assist in our operations (e.g., payment processors)</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  SMS / Text Messaging Opt-In
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  When you provide your phone number and check the opt-in box on our registration forms, you
                  consent to receive informational SMS confirmations related to church events you register for.
                </p>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-8 space-y-2">
                  <li>Message frequency varies depending on your registrations.</li>
                  <li>Msg &amp; data rates may apply from your mobile carrier.</li>
                  <li>You may reply STOP to any message to unsubscribe.</li>
                  <li>We do not share, sell, or rent your SMS opt-in data or consent status with any third parties for promotional or marketing purposes.</li>
                  <li>For help, reply HELP or contact us at info@pmcc4thwatch.us.</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Data Security
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  We implement appropriate security measures to protect your personal information. However,
                  no method of transmission over the Internet or electronic storage is 100% secure. While
                  we strive to protect your information, we cannot guarantee absolute security.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Cookies
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  Our website may use cookies to enhance your browsing experience. Cookies are small files
                  stored on your device that help us understand how you use our website. You can choose to
                  disable cookies through your browser settings, though this may affect some website functionality.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Your Rights
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-8 space-y-2">
                  <li>Access the personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt out of marketing communications</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Children's Privacy
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  Our website is not intended for children under 13 years of age. We do not knowingly
                  collect personal information from children under 13. If you believe we have collected
                  information from a child under 13, please contact us immediately.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Data Deletion
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  You may request deletion of your personal information and account at any time. For detailed
                  instructions, visit our{" "}
                  <Link href="/data-deletion" className="text-secondary hover:underline">Data Deletion</Link>{" "}
                  page, or contact us at{" "}
                  <a href="mailto:info@pmcc4thwatch.us" className="text-secondary hover:underline">info@pmcc4thwatch.us</a>.
                  Upon receiving a verified request, we will delete your personal data from our systems within
                  30 days, except where retention is required by law. If you signed in through Facebook, you
                  can also manage or remove app permissions directly from your{" "}
                  <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                    Facebook App Settings
                  </a>.
                  If you signed in through Google, you can manage or remove app access from your{" "}
                  <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                    Google Account Permissions
                  </a>.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Advertising
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  We do not use your personal information to serve targeted advertisements. We do not share
                  your data with advertisers or advertising networks.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Changes to This Policy
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  We may update this Privacy Policy from time to time. Any changes will be posted on this
                  page with an updated revision date. We encourage you to review this policy periodically.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Contact Us
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  If you have questions about this Privacy Policy or our privacy practices, please contact us at:
                </p>
                <p className="text-slate-600 dark:text-slate-300 mt-4">
                  <strong>Email:</strong> info@pmcc4thwatch.us<br />
                  <strong>Website:</strong> <Link href="/contact" className="text-secondary hover:underline">Contact Page</Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
