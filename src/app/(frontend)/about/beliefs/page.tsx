"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Cross, Church, Users, Book, Clock, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const beliefs = [
  {
    id: 1,
    icon: Cross,
    title: "God - Father, Son, Holy Spirit",
    content: "We believe in one God, The Father, from whom all things came and for whom we live; we believe in one Lord Jesus Christ through whom all things came and through whom we live; we believe in the Holy Spirit, the Spirit of truth who guides, teaches and reminds believers into all truth.",
    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=800&q=80",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    icon: Church,
    title: "The Church of Christ",
    content: "We believe that the true Church of Christ was founded on the day of the Pentecost and there is the continuing operation of the complete gifts of the Holy Spirit in the church today, including the office of Apostleship and other gifts of the Spirit as mentioned in the Scriptures for the perfection of the saints.",
    image: "https://images.pexels.com/photos/2014773/pexels-photo-2014773.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: 3,
    icon: Users,
    title: "Gift of Apostleship",
    content: "We believe that the true church of Christ was founded on the day of the Pentecost and that the gifts of the Holy Spirit remains to be complete and operational in the Church today, including the office of Apostleship and other gifts of the Spirit as mentioned in the Scriptures for the perfection of the saints.",
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=800&q=80",
    color: "from-green-500 to-green-600",
  },
  {
    id: 4,
    icon: Sparkles,
    title: "Salvation",
    content: "We believe that man's salvation is through the finished work of Jesus Christ demonstrated by his suffering, death, and resurrection. And this salvation is attained by grace — not of works by any man or religion.",
    image: "https://images.unsplash.com/photo-1499652848871-1527a310b13a?auto=format&fit=crop&w=800&q=80",
    color: "from-red-500 to-red-600",
  },
  {
    id: 5,
    icon: Book,
    title: "The Bible",
    content: "We believe in the Bible as the inspired words of God and is therefore inerrant and infallible. We believe that it is the final authority on faith and morals for all men.",
    image: "https://images.pexels.com/photos/267559/pexels-photo-267559.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "from-amber-500 to-amber-600",
  },
  {
    id: 6,
    icon: Clock,
    title: "The 4th Watch",
    content: "We believe in the imminence of Christ's return in our time—the 4th Watch. Though we do not believe in the practice of predicting the exact hour, day, month, and year of His return. Those true believers who are waiting for this blessed hope must live their lives on earth in holiness and service unto God.",
    image: "https://images.pexels.com/photos/3175054/pexels-photo-3175054.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: 7,
    icon: Sparkles,
    title: "Our Blessed Hope — The Second Coming",
    content: "We believe in the imminence of Christ's return in our time — the 4th watch. We do not believe in the practice of predicting the exact hour, day, month, and year of His return. Those true believers who are waiting for this blessed hope must live their lives on earth in holiness and service unto God.",
    image: "https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg?auto=compress&cs=tinysrgb&w=800",
    color: "from-cyan-500 to-cyan-600",
  },
];

export default function BeliefsPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f3] dark:bg-[#0a0f1a]">
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
                Our Beliefs
              </span>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6">
                Core Beliefs &
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-300">
                  Doctrines
                </span>
              </h1>
              <p className="text-white/60 text-lg md:text-xl">
                The following are the core beliefs of Pentecostal Missionary Church of Christ (4th Watch)
                based on the foundational truths taught in the Bible. All of our teaching and ministry
                is rooted in and flows out of these biblical doctrines.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Beliefs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-16">
            {beliefs.map((belief, index) => (
              <motion.div
                key={belief.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                <Card className="overflow-hidden">
                  <div className={`grid grid-cols-1 lg:grid-cols-2 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                    {/* Image */}
                    <div className={`relative aspect-[4/3] lg:aspect-auto ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                      <img
                        src={belief.image}
                        alt={belief.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${belief.color} opacity-20`} />
                    </div>

                    {/* Content */}
                    <div className={`p-8 md:p-12 flex flex-col justify-center ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${belief.color} flex items-center justify-center mb-6`}>
                        <belief.icon className="w-7 h-7 text-white" />
                      </div>
                      <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0a0f1a] mb-4">
                        {belief.title}
                      </h2>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {belief.content}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scripture Quote */}
      <section className="py-20 bg-[#0a0f1a]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <BookOpen className="w-12 h-12 text-secondary mx-auto mb-6" />
            <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-white italic leading-relaxed mb-6">
              "All Scripture is given by inspiration of God, and is profitable for doctrine,
              for reproof, for correction, for instruction in righteousness."
            </blockquote>
            <cite className="text-white/50 text-lg">— 2 Timothy 3:16</cite>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#0a0f1a] mb-2">
                Want to Learn More?
              </h2>
              <p className="text-muted-foreground">
                Visit one of our churches and experience our faith community firsthand.
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link href="/about/leaders">
                  Meet Our Leaders
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
