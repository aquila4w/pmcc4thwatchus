"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function TermsOfServicePage() {
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
                <FileText className="w-4 h-4 text-secondary" />
                <span className="text-secondary text-sm font-medium">Legal Agreement</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
                Terms of Service
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
                  Agreement to Terms
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  By accessing or using the Pentecostal Missionary Church of Christ (4th Watch) US District
                  website, you agree to be bound by these Terms of Service. If you do not agree to these
                  terms, please do not use our website.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Use of Website
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  You may use our website for lawful purposes only. You agree not to:
                </p>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-8 space-y-2">
                  <li>Use the website in any way that violates applicable laws or regulations</li>
                  <li>Attempt to gain unauthorized access to any part of the website</li>
                  <li>Use the website to transmit harmful, offensive, or inappropriate content</li>
                  <li>Interfere with the proper functioning of the website</li>
                  <li>Use automated systems to access the website without permission</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Intellectual Property
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  All content on this website, including text, graphics, logos, images, audio clips, and
                  software, is the property of PMCC 4th Watch US District or its content suppliers and is
                  protected by copyright and other intellectual property laws. You may not reproduce,
                  distribute, or create derivative works from this content without our express written consent.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  User Content
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  When you submit content to our website (such as prayer requests, contact forms, or comments),
                  you grant us the right to use, modify, and display that content in connection with our
                  ministry activities. You are responsible for ensuring that any content you submit does not
                  violate the rights of others.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Third-Party Login
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  Our website offers the option to sign in using third-party authentication providers such
                  as Facebook and Google. When you use this feature, the authentication provider shares
                  certain information with us (such as your name and email address) to create and manage
                  your account. Your use of third-party login is also governed by that provider&apos;s terms
                  of service and privacy policy. We do not post to your social media accounts or share your
                  login credentials with any other parties.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Data Deletion
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  You may request deletion of your account and personal data at any time by contacting us
                  at info@pmcc4thwatch.us. Upon receiving a verified request, we will delete your personal
                  data from our systems within 30 days, except where retention is required by law. If you
                  signed in through Facebook, you can also manage or remove app permissions directly from
                  your Facebook App Settings. If you signed in through Google, you can manage or remove
                  app access from your Google Account Permissions.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Donations
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  All donations made through our website are voluntary and non-refundable. Donations are used
                  to support the ministry activities of PMCC 4th Watch US District. We provide donation receipts
                  as required by law. By making a donation, you confirm that the funds are from legal sources.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  External Links
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  Our website may contain links to third-party websites. We are not responsible for the content,
                  privacy practices, or terms of service of these external sites. We encourage you to review
                  the policies of any third-party sites you visit.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Disclaimer of Warranties
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  This website is provided "as is" without warranties of any kind, either express or implied.
                  We do not warrant that the website will be uninterrupted, error-free, or free of viruses or
                  other harmful components. We make no warranties regarding the accuracy or completeness of
                  any content on the website.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  To the fullest extent permitted by law, PMCC 4th Watch US District shall not be liable for
                  any indirect, incidental, special, consequential, or punitive damages arising out of your
                  use of the website or any content therein.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Indemnification
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  You agree to indemnify and hold harmless PMCC 4th Watch US District and its officers,
                  directors, employees, and volunteers from any claims, damages, or expenses arising from
                  your use of the website or violation of these terms.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Changes to Terms
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  We reserve the right to modify these Terms of Service at any time. Changes will be effective
                  immediately upon posting to the website. Your continued use of the website after any changes
                  constitutes acceptance of the new terms.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Governing Law
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  These Terms of Service shall be governed by and construed in accordance with the laws of
                  the United States, without regard to conflicts of law principles.
                </p>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Contact Information
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  If you have questions about these Terms of Service, please contact us:
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
