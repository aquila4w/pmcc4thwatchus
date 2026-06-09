"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function DataDeletionPage() {
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
                <Trash2 className="w-4 h-4 text-secondary" />
                <span className="text-secondary text-sm font-medium">Your Data, Your Control</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
                Data Deletion Instructions
              </h1>
              <p className="text-white/60 text-lg">
                How to request deletion of your personal data
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
                  Requesting Data Deletion
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  If you have created an account on pmcc4thwatch.us using Facebook, Google, or email
                  registration, you can request full deletion of your personal data at any time.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                    How to Request Deletion
                  </h3>
                  <ol className="list-decimal pl-6 text-slate-600 dark:text-slate-300 space-y-3">
                    <li>
                      Send an email to{" "}
                      <a href="mailto:info@pmcc4thwatch.us" className="text-secondary hover:underline font-medium">
                        info@pmcc4thwatch.us
                      </a>{" "}
                      with the subject line <strong>&quot;Data Deletion Request&quot;</strong>
                    </li>
                    <li>
                      Include your registered name and email address so we can locate your account
                    </li>
                    <li>
                      If you signed in through Facebook, include the name associated with your Facebook account
                    </li>
                    <li>
                      If you signed in through Google, include the Google email address used
                    </li>
                  </ol>
                </div>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  What Happens Next
                </h2>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-8 space-y-2">
                  <li>
                    We will verify your identity and confirm receipt of your request within 3 business days
                  </li>
                  <li>
                    Your personal data will be deleted from our systems within <strong>30 days</strong>
                  </li>
                  <li>
                    You will receive a confirmation email once the deletion is complete
                  </li>
                  <li>
                    Certain data may be retained where required by law (e.g., financial records for tax purposes)
                  </li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Manage Third-Party App Permissions
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  You can also remove our app&apos;s access directly from your third-party account at any time:
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <a
                    href="https://www.facebook.com/settings?tab=applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Facebook App Settings</div>
                      <div className="text-sm text-slate-500">Remove app permissions</div>
                    </div>
                  </a>
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Google Account Permissions</div>
                      <div className="text-sm text-slate-500">Remove app access</div>
                    </div>
                  </a>
                </div>

                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Data That May Be Deleted
                </h2>
                <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 mb-8 space-y-2">
                  <li>Account profile (name, email, phone number)</li>
                  <li>Event registration records</li>
                  <li>Check-in and attendance history</li>
                  <li>Login credentials and authentication data</li>
                  <li>Prayer request submissions</li>
                </ul>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-8">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <p className="text-slate-600 dark:text-slate-300">
                      Questions? Contact us at{" "}
                      <a href="mailto:info@pmcc4thwatch.us" className="text-secondary hover:underline font-medium">
                        info@pmcc4thwatch.us
                      </a>
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
