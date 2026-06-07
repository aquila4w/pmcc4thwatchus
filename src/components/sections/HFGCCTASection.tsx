"use client";

import { motion } from "framer-motion";
import { Ticket, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const REGISTER_URL = "/hfgc-ny";
const MERCH_URL = "https://forms.gle/JgGtMZt4MMCxBwBp8";

export function HFGCCTASection() {
  return (
    <section className="relative py-20 sm:py-28 bg-black overflow-hidden">
      {/* Orange glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Are You{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Getting Ready?
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto mb-10">
            Join thousands of believers for a powerful night of worship, salvation, and deliverance.
            This is more than an event — it&apos;s a life-changing experience.
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300"
          >
            <a href={REGISTER_URL}>
              <Ticket className="w-5 h-5 mr-2" />
              Register Now
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white hover:text-white font-semibold text-lg px-8 py-6 rounded-xl border border-white/20"
          >
            <a href={MERCH_URL} target="_blank" rel="noopener noreferrer">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Order Merch
            </a>
          </Button>
        </motion.div>

        {/* Hashtags */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-white/20 text-sm tracking-widest"
        >
          #HFGCNewYork #HFGCNY2026 #ImGettingReadyForHFGC
        </motion.p>
      </div>
    </section>
  );
}
