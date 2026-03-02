"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Users,
  Globe,
  BookOpen,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const aboutLinks = [
  {
    title: "Our Beliefs",
    description: "Core doctrines and foundational truths of our faith",
    href: "/about/beliefs",
    icon: BookOpen,
    color: "bg-amber-500",
  },
  {
    title: "Our Mission",
    description: "Our purpose and calling in the body of Christ",
    href: "/about/mission",
    icon: Heart,
    color: "bg-rose-500",
  },
  {
    title: "Our History",
    description: "The journey of PMCC 4th Watch through the years",
    href: "/about/history",
    icon: Globe,
    color: "bg-emerald-500",
  },
  {
    title: "Servant Leaders",
    description: "Meet the leaders who serve our community",
    href: "/about/leaders",
    icon: Users,
    color: "bg-sky-500",
  },
];

const values = [
  {
    title: "Holiness",
    description: "Pursuing a life set apart for God, living in righteousness and purity.",
  },
  {
    title: "Service",
    description: "Dedicating ourselves to serve God and humanity with love and humility.",
  },
  {
    title: "Evangelism",
    description: "Sharing the Gospel through Home Free Global Crusades worldwide.",
  },
  {
    title: "Community",
    description: "Building a family united in faith, supporting one another's spiritual journey.",
  },
];

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <main className="min-h-screen bg-[#f8f6f3]">
      <Header />

      {/* Hero Section */}
      <section ref={containerRef} className="relative pt-32 pb-32 bg-[#0a0f1a] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ y }}
        >
          <img
            src="https://ext.same-assets.com/99090773/3778162446.jpeg"
            alt="Church gathering"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] via-[#0a0f1a]/90 to-[#0a0f1a]" />
        </motion.div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ opacity }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
              About Us
            </span>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Pentecostal Missionary
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                Church of Christ
              </span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              A movement of believers committed to holiness, evangelism, and service unto the Lord.
              Our US District comprises approximately 50 local churches united in faith and mission.
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Navigation Cards */}
      <section className="py-20 -mt-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutLinks.map((link, index) => (
              <motion.div
                key={link.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={link.href} className="group block h-full">
                  <Card className="p-6 h-full bg-white hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <div className={`w-14 h-14 rounded-xl ${link.color} flex items-center justify-center mb-4`}>
                      <link.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#0a0f1a] mb-2 group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {link.description}
                    </p>
                    <span className="inline-flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The 4th Watch */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
                Why "4th Watch"?
              </span>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a0f1a] mb-6">
                Watching for Christ's Return
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                The name "4th Watch" comes from the biblical concept of the night watches. In ancient times,
                the night was divided into four watches, with the fourth watch being the final period before dawn
                (3 AM - 6 AM).
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                We believe in the imminence of Christ's return in our time - the 4th Watch. Those true believers
                who are waiting for this blessed hope must live their lives on earth in holiness and service unto God.
              </p>
              <blockquote className="border-l-4 border-secondary pl-4 italic text-[#0a0f1a]">
                "Watch therefore, for you do not know what hour your Lord is coming."
                <cite className="block text-sm text-muted-foreground mt-2 not-italic">- Matthew 24:42</cite>
              </blockquote>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img
                  src="https://ext.same-assets.com/99090773/2731046455.jpeg"
                  alt="Worship service"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-secondary text-[#0a0f1a] p-6 rounded-xl">
                <span className="font-serif text-4xl font-bold block">1972</span>
                <span className="text-sm uppercase tracking-wider">Established</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-[#0a0f1a]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
              Our Foundation
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Core Values
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              These values guide everything we do as a community of believers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-white/50">{value.description}</p>
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
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0a0f1a] mb-4">
                Ready to Learn More?
              </h2>
              <p className="text-muted-foreground mb-8">
                Explore our beliefs, mission, and the leaders who guide our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/about/beliefs">
                    Our Beliefs
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/locate">
                    Find a Church
                  </Link>
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
