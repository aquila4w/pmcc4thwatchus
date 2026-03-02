"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Globe, Users, Target, Sparkles, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const missionPillars = [
  {
    icon: Heart,
    title: "Holiness",
    description: "Living a life set apart for God, pursuing righteousness and purity in all we do. We believe that holiness is not just an ideal but a calling for every believer.",
    color: "bg-red-500",
  },
  {
    icon: Users,
    title: "Service",
    description: "Dedicating ourselves to serve God and humanity with love, humility, and excellence. Service is the outward expression of our inward transformation.",
    color: "bg-blue-500",
  },
  {
    icon: Globe,
    title: "Evangelism",
    description: "Sharing the Gospel of Jesus Christ to all nations through Home Free Global Crusades, reaching the lost and bringing them into the fold.",
    color: "bg-green-500",
  },
  {
    icon: Target,
    title: "Discipleship",
    description: "Nurturing believers to grow in their faith, equipping them to become mature disciples who can mentor others in their spiritual journey.",
    color: "bg-purple-500",
  },
];

const visionPoints = [
  "To see souls saved and transformed by the power of the Gospel",
  "To raise a generation of holy and committed believers",
  "To establish apostolic churches in every nation",
  "To prepare believers for the second coming of Christ",
  "To impact communities through acts of service and compassion",
];

export default function MissionPage() {
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to About
            </Link>

            <div className="max-w-3xl">
              <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
                Our Purpose
              </span>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6">
                Our
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                  Mission
                </span>
              </h1>
              <p className="text-white/60 text-lg md:text-xl">
                We exist to glorify God by making disciples of all nations,
                proclaiming the Gospel with power, and preparing believers for
                the imminent return of Jesus Christ.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/20">
              <Sparkles className="w-12 h-12 text-secondary mx-auto mb-6" />
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0a0f1a] mb-6">
                Mission Statement
              </h2>
              <p className="text-xl md:text-2xl text-[#0a0f1a]/80 leading-relaxed italic">
                "To preach the Gospel of Jesus Christ to all nations, establish apostolic churches,
                nurture believers unto holiness and service, and prepare them for the glorious
                return of our Lord Jesus Christ in the 4th Watch."
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Mission Pillars */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
              Our Focus
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a0f1a] mb-4">
              Four Pillars of Our Mission
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {missionPillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-8 h-full hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 rounded-2xl ${pillar.color} flex items-center justify-center flex-shrink-0`}>
                      <pillar.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-[#0a0f1a] mb-3">
                        {pillar.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 bg-[#0a0f1a]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
                Our Vision
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
                What We're Working Toward
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                We envision a world where every person has the opportunity to hear the Gospel
                and respond to the saving grace of Jesus Christ. Our vision extends beyond
                Sunday services to a 24/7 lifestyle of worship, service, and witness.
              </p>
              <div className="space-y-4">
                {visionPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                    </div>
                    <p className="text-white/80">{point}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://ext.same-assets.com/99090773/3086591134.jpeg"
                  alt="Vision"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-secondary text-[#0a0f1a] p-6 rounded-xl">
                <Globe className="w-8 h-8 mb-2" />
                <span className="font-serif text-lg font-bold block">Global Reach</span>
                <span className="text-sm">6 Continents</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Home Free Global Crusade */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-square lg:aspect-auto relative">
                  <img
                    src="https://ext.same-assets.com/99090773/3778162446.jpeg"
                    alt="Home Free Global Crusade"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
                    Our Flagship Ministry
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0a0f1a] mb-4">
                    Home Free Global Crusade
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    The Home Free Global Crusade (HFGC) is our annual evangelistic outreach that brings
                    together churches from around the world for a unified effort in soul-winning.
                    Through these crusades, thousands have come to know Christ.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Each HFGC features powerful worship, anointed preaching, and opportunities for
                    baptism and spiritual empowerment. It's a time of refreshing and recommitment
                    for all believers.
                  </p>
                  <Button asChild className="w-fit">
                    <Link href="/events">
                      See Upcoming Crusades
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0a0f1a] mb-2">
                Join Us in Our Mission
              </h2>
              <p className="text-muted-foreground">
                Be part of something greater. Find a church and start your journey today.
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link href="/about/beliefs">
                  Our Beliefs
                </Link>
              </Button>
              <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                <Link href="/locate">
                  Find a Church
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
