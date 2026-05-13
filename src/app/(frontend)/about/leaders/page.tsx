"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

interface Leader {
  id: string;
  name: string;
  title: string;
  image: string;
}

// Leaders in numerical order (1-11)
const leaders: Leader[] = [
  {
    id: "1-arsenio-ferriol",
    name: "Apostle Arsenio T. Ferriol",
    title: "Goodman of the House and Apostle in the End-Time",
    image: "/images/leaders/01-apostle-arsenio-ferriol.png",
  },
  {
    id: "2-jonathan-ferriol",
    name: "Apostle Jonathan S. Ferriol",
    title: "Chief Executive Minister",
    image: "/images/leaders/02-apostle-jonathan-ferriol.webp",
  },
  {
    id: "3-leticia-ferriol",
    name: "Evangelist Leticia Ferriol",
    title: "Evangelist",
    image: "/images/leaders/03-evangelist-leticia-ferriol.webp",
  },
  {
    id: "4-arturo-ferriol",
    name: "Archbishop Arturo Ferriol",
    title: "Archbishop",
    image: "/images/leaders/04-archbishop-arturo-ferriol.webp",
  },
  {
    id: "5-domingo-ferriol",
    name: "Bishop Domingo Ferriol",
    title: "Bishop",
    image: "/images/leaders/05-bishop-domingo-ferriol.webp",
  },
  {
    id: "6-osinando-quillao",
    name: "Bishop Osinando Quillao",
    title: "Bishop",
    image: "/images/leaders/06-bishop-osinando-quillao.webp",
  },
  {
    id: "7-rustico-zonio",
    name: "Bishop Rustico Zonio",
    title: "Bishop",
    image: "/images/leaders/07-bishop-rustico-zonio.webp",
  },
  {
    id: "8-aldrin-palanca",
    name: "Bishop Aldrin Palanca",
    title: "Bishop",
    image: "/images/leaders/08-bishop-aldrin-palanca.webp",
  },
  {
    id: "9-reynald-sulayao",
    name: "Bishop Reynald Sulayao",
    title: "Bishop",
    image: "/images/leaders/09-bishop-reynald-sulayao.webp",
  },
  {
    id: "10-samuel-ferriol",
    name: "Bishop Samuel Ferriol",
    title: "Bishop",
    image: "/images/leaders/10-bishop-samuel-ferriol.webp",
  },
  {
    id: "11-violy-concepcion",
    name: "Evangelist Violy Concepcion",
    title: "Evangelist",
    image: "/images/leaders/11-evangelist-violy-concepcion.webp",
  },
];

export default function LeadersPage() {
  // Split leaders into rows: 3-3-3-2
  const row1 = leaders.slice(0, 3);
  const row2 = leaders.slice(3, 6);
  const row3 = leaders.slice(6, 9);
  const row4 = leaders.slice(9, 11);

  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      <Header />

      {/* Hero Banner */}
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
              Meet Our
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center"
            >
              Servant Leaders
            </motion.h1>
          </div>
        </div>
      </section>

      {/* Back Link */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to About
        </Link>
      </div>

      {/* Leaders Grid - No captions, just images */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {/* Row 1 - 3 leaders */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {row1.map((leader, index) => (
              <motion.div
                key={leader.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={`/about/leaders/${leader.id}`}
                  className="block group"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1f2e]">
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      fill
                      sizes="(max-width: 768px) 33vw, 25vw"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/50 rounded-xl transition-colors duration-300" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Row 2 - 3 leaders */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {row2.map((leader, index) => (
              <motion.div
                key={leader.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index + 3) * 0.1 }}
              >
                <Link
                  href={`/about/leaders/${leader.id}`}
                  className="block group"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1f2e]">
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      fill
                      sizes="(max-width: 768px) 33vw, 25vw"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/50 rounded-xl transition-colors duration-300" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Row 3 - 3 leaders */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {row3.map((leader, index) => (
              <motion.div
                key={leader.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index + 6) * 0.1 }}
              >
                <Link
                  href={`/about/leaders/${leader.id}`}
                  className="block group"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1f2e]">
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      fill
                      sizes="(max-width: 768px) 33vw, 25vw"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/50 rounded-xl transition-colors duration-300" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Row 4 - 2 leaders (centered) */}
          <div className="flex justify-center gap-4 md:gap-6">
            {row4.map((leader, index) => (
              <motion.div
                key={leader.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index + 9) * 0.1 }}
                className="w-[calc(33.333%-1rem)] md:w-[calc(33.333%-1.5rem)]"
              >
                <Link
                  href={`/about/leaders/${leader.id}`}
                  className="block group"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1f2e]">
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      fill
                      sizes="(max-width: 768px) 33vw, 25vw"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/50 rounded-xl transition-colors duration-300" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scripture Quote */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl text-white/80 italic leading-relaxed mb-6">
              "And he gave some, apostles; and some, prophets; and some, evangelists;
              and some, pastors and teachers; For the perfecting of the saints,
              for the work of the ministry, for the edifying of the body of Christ."
            </blockquote>
            <cite className="text-secondary text-lg">— Ephesians 4:11-12</cite>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">
                Connect With Us
              </h2>
              <p className="text-white/60">
                Visit one of our churches and meet our local leaders.
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
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
