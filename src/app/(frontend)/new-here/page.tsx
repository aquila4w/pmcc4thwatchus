"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  MapPin,
  Calendar,
  Clock,
  Users,
  BookOpen,
  ArrowRight,
  ChevronRight,
  MessageCircle,
  Music,
  Baby,
  Coffee,
  HandHeart,
  CheckCircle2
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const whatToExpect = [
  {
    icon: Clock,
    title: "Church Services",
    description: "We are believers who always meet together. We gather for worship, prayer, and teaching from God's Word.",
  },
  {
    icon: Music,
    title: "Worship Style",
    description: "Expect heartfelt worship with a blend of traditional hymns and contemporary songs. We believe in Spirit-led praise.",
  },
  {
    icon: BookOpen,
    title: "Biblical Teaching",
    description: "Our messages are rooted in Scripture. Bring your Bible or use the verses displayed on screen.",
  },
  {
    icon: Users,
    title: "Welcoming Community",
    description: "You'll be greeted warmly. We're a diverse family united by faith. Come as you are!",
  },
];

const nextSteps = [
  {
    step: 1,
    title: "Visit a Sunday Service",
    description: "Experience our worship and community firsthand. We meet every Sunday.",
    action: "Find a Church",
    link: "/locate",
  },
  {
    step: 2,
    title: "Connect with Us",
    description: "Fill out a connection card or speak with one of our greeters after service.",
    action: "Contact Us",
    link: "/contact",
  },
  {
    step: 3,
    title: "Join a Bible Study",
    description: "Deepen your understanding of God's Word in a smaller group setting.",
    action: "Learn More",
    link: "/about/beliefs",
  },
  {
    step: 4,
    title: "Get Involved",
    description: "Discover your gifts and find ways to serve in our community.",
    action: "See Events",
    link: "/events",
  },
];

const faqs = [
  {
    question: "What should I wear?",
    answer: "There's no dress code. Some come in suits, others in jeans. We care more about your heart than your outfit!",
  },
  {
    question: "Is there parking available?",
    answer: "Yes, most of our churches have dedicated parking lots. Arrive a bit early for your first visit.",
  },
  {
    question: "Do you have programs for children?",
    answer: "Yes! We have Sunday School and children's ministry programs during our services. Your kids will be in good hands.",
  },
  {
    question: "Can I just come and observe?",
    answer: "Absolutely! You're welcome to come and experience our service without any pressure. Take your time.",
  },

];

export default function NewHerePage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-[#f8f6f3]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 bg-[#0a0f1a] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://ext.same-assets.com/99090773/2731046455.jpeg"
            alt="Welcome"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/80 via-[#0a0f1a]/70 to-[#0a0f1a]" />
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
              <span className="text-secondary text-sm font-medium">Welcome to Our Family</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              You Belong
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                Here
              </span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Whether you're exploring faith for the first time or looking for a new church home,
              we're glad you're here. Everyone is welcome at PMCC 4th Watch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                <Link href="/locate">
                  <MapPin className="w-4 h-4 mr-2" />
                  Find a Church Near You
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link href="/events">
                  <Calendar className="w-4 h-4 mr-2" />
                  Upcoming Events
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What to Expect */}
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
              Your First Visit
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a0f1a] mb-4">
              What to Expect
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We want you to feel comfortable and at home from the moment you arrive.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whatToExpect.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#0a0f1a] mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
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
              Get Started
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a0f1a] mb-4">
              Your Next Steps
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Here's how you can begin your journey with us.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {nextSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full relative overflow-hidden group hover:shadow-xl transition-all">
                  <div className="absolute -top-4 -right-4 text-8xl font-bold text-primary/5">
                    {step.step}
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">
                      {step.step}
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#0a0f1a] mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <Link
                      href={step.link}
                      className="inline-flex items-center text-primary font-medium hover:gap-2 transition-all"
                    >
                      {step.action}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
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
                Our Mission
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
                Holiness & Service Unto the Lord
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                PMCC 4th Watch is the end-time apostolic church committed to living holy lives and serving
                God with all our hearts. We believe in the imminent return of Christ and strive to be
                ready, watching and waiting as faithful servants.
              </p>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Our churches span across the United States and beyond, united by our shared faith
                and mission to spread the Gospel through Home Free Global Crusades and community outreach.
              </p>
              <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                <Link href="/about">
                  Learn About Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-800">
                <img
                  src="https://ext.same-assets.com/99090773/3778162446.jpeg"
                  alt="Church gathering"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                    <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQs */}
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
              Questions?
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a0f1a] mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left"
                >
                  <Card className={`p-6 mb-4 transition-all ${expandedFaq === index ? "shadow-lg" : "hover:shadow-md"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-[#0a0f1a]">{faq.question}</h3>
                      <ChevronRight
                        className={`w-5 h-5 text-primary transition-transform ${
                          expandedFaq === index ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                    {expandedFaq === index && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-muted-foreground mt-4"
                      >
                        {faq.answer}
                      </motion.p>
                    )}
                  </Card>
                </button>
              </motion.div>
            ))}
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
            <HandHeart className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0a0f1a] mb-4">
              We Can't Wait to Meet You
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join us this Sunday and discover a community that will walk with you on your faith journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
                <Link href="/locate">
                  Find a Church
                  <MapPin className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ask a Question
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
