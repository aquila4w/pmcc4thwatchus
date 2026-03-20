"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Gift,
  Users,
  Globe,
  ArrowRight,
  CreditCard,
  Building2,
  Smartphone,
  Shield,
  CheckCircle2
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const givingMethods = [
  {
    icon: CreditCard,
    title: "Online Giving",
    description: "Secure online donations through our giving portal. One-time or recurring gifts.",
    available: true,
  },
  {
    icon: Building2,
    title: "In-Person",
    description: "Give during our worship services at any of our local churches.",
    available: true,
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Download our app for convenient giving on the go.",
    available: false,
    comingSoon: true,
  },
];

const impactAreas = [
  {
    title: "Local Ministry",
    percentage: 40,
    description: "Supporting local church operations, worship services, and community programs.",
  },
  {
    title: "Missions & Outreach",
    percentage: 30,
    description: "Funding Home Free Global Crusades and international evangelistic efforts.",
  },
  {
    title: "Community Care",
    percentage: 20,
    description: "Helping families in need, disaster relief, and compassion ministries.",
  },
  {
    title: "Leadership Development",
    percentage: 10,
    description: "Training and equipping the next generation of church leaders.",
  },
];

const testimonials = [
  {
    quote: "Being able to support the church's mission has been such a blessing. I've seen firsthand how our giving impacts lives.",
    name: "Maria S.",
    church: "Los Angeles",
  },
  {
    quote: "The Home Free Global Crusade changed my life. Now I give to help others experience that same transformation.",
    name: "James R.",
    church: "San Francisco",
  },
];

export default function GivePage() {
  return (
    <main className="min-h-screen bg-[#f8f6f3]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 bg-[#0a0f1a] overflow-hidden">
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
            <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/30 rounded-full px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-secondary" />
              <span className="text-secondary text-sm font-medium">Support Our Mission</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Give
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                Generously
              </span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Your generosity enables us to spread the Gospel, care for communities,
              and transform lives around the world.
            </p>
            <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
              <a href="#give-now">
                Give Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Scripture */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <blockquote className="font-serif text-xl md:text-2xl text-[#0a0f1a] italic">
              "Each of you should give what you have decided in your heart to give,
              not reluctantly or under compulsion, for God loves a cheerful giver."
            </blockquote>
            <cite className="text-muted-foreground mt-4 block">— 2 Corinthians 9:7</cite>
          </motion.div>
        </div>
      </section>

      {/* Ways to Give */}
      <section id="give-now" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
              Ways to Give
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a0f1a] mb-4">
              Choose Your Method
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We've made it easy for you to give in a way that works best for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {givingMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`p-6 h-full text-center ${!method.available ? "opacity-60" : "hover:shadow-xl"} transition-shadow`}>
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <method.icon className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#0a0f1a] mb-3">{method.title}</h3>
                  <p className="text-muted-foreground mb-4">{method.description}</p>
                  {method.comingSoon ? (
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-sm rounded-full">
                      Coming Soon
                    </span>
                  ) : (
                    <Button className="w-full bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                      {method.title === "In-Person" ? "Find a Church" : "Give Now"}
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Areas */}
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
                Your Impact
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
                Where Your Giving Goes
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Every gift makes a difference. Here's how your generosity is used to
                advance the Kingdom of God.
              </p>

              <div className="space-y-6">
                {impactAreas.map((area, index) => (
                  <motion.div
                    key={area.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{area.title}</span>
                      <span className="text-secondary font-bold">{area.percentage}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${area.percentage}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className="h-full bg-secondary rounded-full"
                      />
                    </div>
                    <p className="text-white/40 text-sm mt-1">{area.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 bg-white/5 border-white/10">
                <h3 className="font-serif text-2xl font-bold text-white mb-6 text-center">
                  By the Numbers
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Globe className="w-8 h-8 text-secondary mx-auto mb-2" />
                    <span className="text-3xl font-bold text-white block">100+</span>
                    <span className="text-white/50 text-sm">Countries Reached</span>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
                    <span className="text-3xl font-bold text-white block">10K+</span>
                    <span className="text-white/50 text-sm">Lives Impacted Yearly</span>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Gift className="w-8 h-8 text-secondary mx-auto mb-2" />
                    <span className="text-3xl font-bold text-white block">500+</span>
                    <span className="text-white/50 text-sm">Families Supported</span>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Heart className="w-8 h-8 text-secondary mx-auto mb-2" />
                    <span className="text-3xl font-bold text-white block">1000+</span>
                    <span className="text-white/50 text-sm">Baptisms Annually</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-[0.3em] mb-4">
              Stories of Impact
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0a0f1a]">
              Why We Give
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <blockquote className="text-lg text-[#0a0f1a] italic mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="text-secondary font-bold">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0a0f1a]">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.church} Church</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-green-500" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>501(c)(3) Non-Profit</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Tax Deductible</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Heart className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0a0f1a] mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Your gift, no matter the size, helps advance the Gospel and transform lives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                Give Online Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
