"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

interface Leader {
  id: string;
  name: string;
  title: string;
  image: string;
  bio: string;
  fullBio: string;
}

// Leaders in numerical order (1-11) - matching the main leaders page
const leaders: Leader[] = [
  {
    id: "1-arsenio-ferriol",
    name: "Apostle Arsenio T. Ferriol",
    title: "Goodman of the House and Apostle in the End-Time",
    image: "/images/leaders/01-apostle-arsenio-ferriol.png",
    bio: "Apostle Arsenio T. Ferriol is the founder and Apostle of the Pentecostal Missionary Church of Christ (4th Watch).",
    fullBio:
      "Apostle Arsenio T. Ferriol is the founder and Apostle of the Pentecostal Missionary Church of Christ (4th Watch). Through his leadership and divine calling, the church has grown from a small congregation to a global movement spanning over 100 countries.\n\nHis ministry began with a vision of holiness and service unto the Lord, establishing a church that would stand firm in apostolic doctrine and practice. Under his guidance, the 4th Watch movement has planted churches across the globe, reaching souls in every continent.\n\nApostle Ferriol's teachings emphasize the importance of spiritual empowerment, dedicated service, and unwavering faith in God's Word. His legacy continues to inspire millions of believers worldwide.\n\nAs the Goodman of the House, he leads with wisdom, compassion, and an unwavering commitment to the Great Commission. His ministry has been marked by countless miracles, transformed lives, and a global harvest of souls for the Kingdom of God.",
  },
  {
    id: "2-jonathan-ferriol",
    name: "Apostle Jonathan S. Ferriol",
    title: "Chief Executive Minister",
    image: "/images/leaders/02-apostle-jonathan-ferriol.webp",
    bio: "Apostle Jonathan S. Ferriol continues the apostolic mission, leading the church with wisdom and dedication to the Gospel.",
    fullBio:
      "Apostle Jonathan S. Ferriol serves as the Chief Executive Minister, continuing the apostolic mission and leading the church with wisdom and dedication to the Gospel. His leadership is characterized by a deep commitment to sound doctrine, fervent prayer, and compassionate pastoral care.\n\nHe has been instrumental in strengthening the church's global outreach and discipleship programs. Under his guidance, the ministry has expanded its reach, establishing new congregations and training centers worldwide.\n\nApostle Jonathan's ministry focuses on equipping believers for the work of the ministry and building up the body of Christ. His preaching is marked by clarity, conviction, and a heart for revival.\n\nUnder his guidance, many young ministers have been raised up and sent out to plant churches and spread the Gospel throughout the nations.",
  },
  {
    id: "3-leticia-ferriol",
    name: "Evangelist Leticia Ferriol",
    title: "Evangelist",
    image: "/images/leaders/03-evangelist-leticia-ferriol.webp",
    bio: "Evangelist Leticia Ferriol serves faithfully in the ministry with a heart for souls and dedication to the Gospel.",
    fullBio:
      "Evangelist Leticia Ferriol serves faithfully in the ministry with a heart for souls and unwavering dedication to the Gospel of Jesus Christ.\n\nHer ministry has touched countless lives through evangelistic outreaches, teaching, and personal discipleship. She has been a pillar of faith and service in the church for many years.\n\nEvangelist Ferriol is known for her compassionate heart, tireless service, and commitment to winning souls for Christ. Her testimony of faith continues to inspire believers across the church.\n\nShe has played a vital role in the growth and development of the ministry, particularly in nurturing new believers and strengthening the faith of the congregation.",
  },
  {
    id: "4-arturo-ferriol",
    name: "Archbishop Arturo Ferriol",
    title: "Archbishop",
    image: "/images/leaders/04-archbishop-arturo-ferriol.webp",
    bio: "Archbishop Arturo Ferriol serves as a faithful shepherd, overseeing congregations with wisdom and pastoral care.",
    fullBio:
      "Archbishop Arturo Ferriol serves as a faithful shepherd in the Pentecostal Missionary Church of Christ (4th Watch), overseeing congregations with wisdom, love, and dedicated pastoral care.\n\nHis ministry spans many years of faithful service, during which he has mentored countless believers and established strong local churches. Archbishop Ferriol is known for his gift of teaching and his ability to communicate biblical truths with clarity and power.\n\nHe has been instrumental in training and raising up new leaders, ensuring the continued growth and health of the church. His commitment to prayer and holiness serves as an example to all who serve alongside him.\n\nArchbishop Ferriol continues to lead with humility and a servant's heart, always pointing others to Christ.",
  },
  {
    id: "5-domingo-ferriol",
    name: "Bishop Domingo Ferriol",
    title: "Bishop",
    image: "/images/leaders/05-bishop-domingo-ferriol.webp",
    bio: "Bishop Domingo Ferriol leads with dedication and a heart for building strong, Christ-centered communities.",
    fullBio:
      "Bishop Domingo Ferriol leads with dedication and a heart for building strong, Christ-centered communities. His ministry is marked by a passion for discipleship and spiritual formation.\n\nFor many years, Bishop Ferriol has faithfully served the church, shepherding congregations through seasons of growth and challenge. His preaching ministry is characterized by biblical depth and practical application.\n\nHe has been a strong advocate for missions and evangelism, encouraging believers to share their faith and reach their communities with the Gospel. His leadership has helped establish and strengthen numerous local congregations.\n\nBishop Ferriol's life exemplifies the servant leadership that Christ calls all ministers to embody.",
  },
  {
    id: "6-osinando-quillao",
    name: "Bishop Osinando Quillao",
    title: "Bishop",
    image: "/images/leaders/06-bishop-osinando-quillao.webp",
    bio: "Bishop Osinando Quillao serves faithfully in ministry, nurturing believers and expanding God's Kingdom.",
    fullBio:
      "Bishop Osinando Quillao serves faithfully in ministry, nurturing believers and working tirelessly to expand God's Kingdom. His dedication to the church spans decades of committed service.\n\nBishop Quillao has a special gift for pastoral care, walking alongside believers through life's joys and challenges. His counseling ministry has brought healing and restoration to many families.\n\nHe is deeply committed to prayer and intercession, often leading the congregation in seasons of seeking God's face. His faith and perseverance have been an encouragement to all who know him.\n\nThrough his leadership, many have come to know Christ and have grown in their faith journey.",
  },
  {
    id: "7-rustico-zonio",
    name: "Bishop Rustico Zonio",
    title: "Bishop",
    image: "/images/leaders/07-bishop-rustico-zonio.webp",
    bio: "Bishop Rustico Zonio is a devoted servant of God, committed to teaching and shepherding the flock.",
    fullBio:
      "Bishop Rustico Zonio is a devoted servant of God, committed to teaching sound doctrine and shepherding the flock with tender care. His ministry reflects a deep love for God's Word and His people.\n\nBishop Zonio has dedicated his life to the study and teaching of Scripture, helping believers grow in their understanding of God's truth. His Bible studies and sermons are known for their depth and practical wisdom.\n\nHe has been actively involved in training new ministers and equipping them for effective service. His mentorship has produced many faithful leaders who now serve in various capacities.\n\nBishop Zonio's humble spirit and faithful service continue to bless the church and honor the Lord.",
  },
  {
    id: "8-aldrin-palanca",
    name: "Bishop Aldrin Palanca",
    title: "Bishop",
    image: "/images/leaders/08-bishop-aldrin-palanca.webp",
    bio: "Bishop Aldrin Palanca is a faithful minister of the Gospel with a heart for missions.",
    fullBio:
      "Bishop Aldrin Palanca is a faithful minister of the Gospel with a heart for missions and a vision for reaching the nations. His ministry has extended beyond local congregations to impact communities worldwide.\n\nBishop Palanca has been involved in numerous mission trips and outreaches, bringing the Gospel to places where it has never been preached. His passion for the Great Commission is contagious.\n\nHe has also been instrumental in mobilizing resources and support for missionaries around the world. His administrative gifts have strengthened the church's global missions efforts.\n\nBishop Palanca continues to serve with excellence, always seeking to glorify God and advance His Kingdom.",
  },
  {
    id: "9-reynald-sulayao",
    name: "Bishop Reynald Sulayao",
    title: "Bishop",
    image: "/images/leaders/09-bishop-reynald-sulayao.webp",
    bio: "Bishop Reynald Sulayao leads with integrity and a commitment to raising up the next generation.",
    fullBio:
      "Bishop Reynald Sulayao leads with integrity and a deep commitment to raising up the next generation of believers and leaders. His ministry focuses on youth and young adults.\n\nBishop Sulayao has developed effective discipleship programs that have helped young people grow in their faith and discover their calling. His relatability and genuine care have made him a trusted mentor to many.\n\nHe believes strongly in the potential of young people to impact the world for Christ and invests heavily in their spiritual development. Many young leaders credit his influence in shaping their ministry.\n\nBishop Sulayao's legacy is seen in the lives of those he has discipled and the congregations he has helped to grow.",
  },
  {
    id: "10-samuel-ferriol",
    name: "Bishop Samuel Ferriol",
    title: "Bishop",
    image: "/images/leaders/10-bishop-samuel-ferriol.webp",
    bio: "Bishop Samuel Ferriol serves with passion for evangelism and a heart for reaching the lost.",
    fullBio:
      "Bishop Samuel Ferriol serves with passion for evangelism and a heart for reaching the lost with the Gospel of Jesus Christ. His ministry has been characterized by bold proclamation and compassionate outreach.\n\nBishop Ferriol has led numerous evangelistic campaigns, seeing many souls come to salvation. His gift for connecting with people from all walks of life has made him an effective witness for Christ.\n\nHe is also deeply committed to church planting, having helped establish several new congregations. His vision for reaching unreached communities continues to drive his ministry.\n\nBishop Ferriol's zeal for souls and his faithfulness to the calling inspire all who serve with him.",
  },
  {
    id: "11-violy-concepcion",
    name: "Evangelist Violy Concepcion",
    title: "Evangelist",
    image: "/images/leaders/11-evangelist-violy-concepcion.webp",
    bio: "Evangelist Violy Concepcion serves the church with dedication, wisdom, and a shepherd's heart.",
    fullBio:
      "Evangelist Violy Concepcion serves the church with dedication, wisdom, and a true shepherd's heart. Her ministry is characterized by faithful service and genuine love for God's people.\n\nEvangelist Concepcion has shepherded congregations through various seasons, providing steady leadership and spiritual guidance. Her preaching ministry emphasizes practical Christian living and spiritual growth.\n\nShe is known for her accessibility and willingness to serve, often going above and beyond to meet the needs of the congregation. Her example of servant leadership has inspired many.\n\nEvangelist Concepcion continues to faithfully serve the Lord, building up believers and extending God's Kingdom through her ministry.",
  },
];

export default function LeaderDetailPage() {
  const params = useParams();
  const leaderId = params.id as string;

  const currentIndex = leaders.findIndex((l) => l.id === leaderId);
  const leader = leaders[currentIndex];

  if (!leader) {
    return (
      <main className="min-h-screen bg-[#0a0f1a]">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-serif text-4xl font-bold text-white mb-4">Leader Not Found</h1>
          <p className="text-white/60 mb-8">The leader you're looking for doesn't exist.</p>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-[#0a0f1a]">
            <Link href="/about/leaders">View All Leaders</Link>
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  const prevLeader = currentIndex > 0 ? leaders[currentIndex - 1] : leaders[leaders.length - 1];
  const nextLeader = currentIndex < leaders.length - 1 ? leaders[currentIndex + 1] : leaders[0];

  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20">
        <div className="absolute inset-0 h-[50vh] bg-gradient-to-b from-secondary/10 to-transparent" />

        <div className="container mx-auto px-4 py-12">
          {/* Back Link */}
          <Link
            href="/about/leaders"
            className="relative z-10 inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Leaders
          </Link>

          {/* Leader Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#1a1f2e]">
                <Image
                  src={leader.image}
                  alt={leader.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-top"
                  priority
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 border-2 border-secondary/30 rounded-2xl -z-10" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-secondary/10 rounded-2xl -z-10" />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:py-8"
            >
              <span className="inline-block text-secondary text-sm uppercase tracking-[0.2em] mb-4">
                {leader.title}
              </span>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {leader.name}
              </h1>

              <div className="w-16 h-1 bg-secondary mb-8" />

              <div className="prose prose-lg prose-invert">
                {(leader.fullBio || leader.bio).split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-white/70 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Navigation Counter */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <span className="text-white/40 text-sm">
                  {currentIndex + 1} of {leaders.length} Servant Leaders
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Navigation to Other Leaders */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Previous Leader */}
            <Link
              href={`/about/leaders/${prevLeader.id}`}
              className="group flex items-center gap-4 p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white/50 group-hover:text-secondary transition-colors" />
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={prevLeader.image}
                    alt={prevLeader.name}
                    fill
                    sizes="64px"
                    className="object-cover object-top"
                  />
                </div>
                <div>
                  <span className="text-white/50 text-xs uppercase tracking-wider">Previous</span>
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-secondary transition-colors">
                    {prevLeader.name}
                  </h3>
                </div>
              </div>
            </Link>

            {/* Next Leader */}
            <Link
              href={`/about/leaders/${nextLeader.id}`}
              className="group flex items-center gap-4 p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 justify-end text-right">
                <div>
                  <span className="text-white/50 text-xs uppercase tracking-wider">Next</span>
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-secondary transition-colors">
                    {nextLeader.name}
                  </h3>
                </div>
                <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={nextLeader.image}
                    alt={nextLeader.name}
                    fill
                    sizes="64px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-secondary transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">
                Connect With Our Church
              </h2>
              <p className="text-white/60">
                Find a local congregation and experience our community firsthand.
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link href="/about/leaders">
                  All Leaders
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
