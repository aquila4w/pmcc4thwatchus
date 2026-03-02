"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Users,
  Heart,
  Music,
  BookOpen,
  Baby,
  Briefcase,
  Globe,
  HandHeart,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const ministries = [
  {
    icon: Users,
    title: "Youth Ministry",
    description: "Empowering young people to live for Christ and make a difference in their generation.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
    activities: ["Youth Services", "Bible Studies", "Fellowship Events", "Outreach Programs"],
  },
  {
    icon: Heart,
    title: "Women's Ministry",
    description: "Building godly women through fellowship, prayer, and biblical teaching.",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80",
    activities: ["Women's Fellowship", "Prayer Groups", "Mentorship Programs", "Community Service"],
  },
  {
    icon: Briefcase,
    title: "Men's Ministry",
    description: "Equipping men to be spiritual leaders in their homes and communities.",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&q=80",
    activities: ["Men's Fellowship", "Leadership Training", "Accountability Groups", "Service Projects"],
  },
  {
    icon: Baby,
    title: "Children's Ministry",
    description: "Teaching children the Word of God in fun and engaging ways.",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
    activities: ["Sunday School", "Kids' Church", "VBS Programs", "Family Events"],
  },
  {
    icon: Music,
    title: "Worship Ministry",
    description: "Leading the congregation in Spirit-filled worship through music and song.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    activities: ["Choir", "Worship Team", "Music Training", "Special Performances"],
  },
  {
    icon: BookOpen,
    title: "Bible Study Ministry",
    description: "Deep diving into Scripture for spiritual growth and understanding.",
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&q=80",
    activities: ["Weekly Studies", "Book Studies", "Topical Series", "New Believer Classes"],
  },
  {
    icon: Globe,
    title: "Missions Ministry",
    description: "Spreading the Gospel locally and globally through evangelistic efforts.",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80",
    activities: ["Local Outreach", "Mission Trips", "Church Planting", "Community Aid"],
  },
  {
    icon: HandHeart,
    title: "Compassion Ministry",
    description: "Serving the community through acts of love and practical assistance.",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80",
    activities: ["Food Distribution", "Hospital Visits", "Prison Ministry", "Disaster Relief"],
  },
];

export default function MinistriesPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      <Header />

      {/* Hero */}
      <section className="relative pt-20">
        <div className="relative h-[300px] md:h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2035] via-[#0a0f1a] to-[#0d1220]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-secondary text-sm uppercase tracking-[0.3em] mb-4"
            >
              Get Involved
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center"
            >
              Our Ministries
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 mt-4 text-center max-w-xl px-4"
            >
              Find your place to serve and grow in our church family
            </motion.p>
          </div>
        </div>
      </section>

      {/* Ministries Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ministries.map((ministry, index) => (
              <motion.div
                key={ministry.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-secondary/30 transition-colors"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative aspect-square lg:aspect-auto">
                    <Image
                      src={ministry.image}
                      alt={ministry.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0a0f1a] via-[#0a0f1a]/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 lg:hidden">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                        <ministry.icon className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 lg:p-8 flex flex-col justify-center">
                    <div className="hidden lg:flex w-12 h-12 rounded-full bg-secondary/20 items-center justify-center mb-4">
                      <ministry.icon className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white mb-3 group-hover:text-secondary transition-colors">
                      {ministry.title}
                    </h3>
                    <p className="text-white/60 mb-4">{ministry.description}</p>
                    <div className="space-y-2">
                      {ministry.activities.map((activity) => (
                        <div key={activity} className="flex items-center gap-2 text-sm text-white/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Serve?
              </h2>
              <p className="text-white/60 text-lg mb-8">
                We believe everyone has a God-given purpose and gifts to share.
                Connect with us to find the ministry that's right for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                  <Link href="/contact">
                    Get Connected <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Link href="/locate">Find a Church</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
