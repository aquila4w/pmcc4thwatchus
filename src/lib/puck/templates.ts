import type { Data } from "@measured/puck";

export interface PuckTemplate {
  id: string;
  name: string;
  description: string;
  category: "landing" | "event" | "ministry" | "about" | "contact" | "general";
  thumbnail?: string;
  data: Data;
}

export const puckTemplates: PuckTemplate[] = [
  // ============================================
  // LANDING PAGE TEMPLATES
  // ============================================
  {
    id: "landing-classic",
    name: "Classic Landing Page",
    description: "Hero section with CTA, about section, services, and contact information",
    category: "landing",
    data: {
      content: [
        {
          type: "Hero",
          props: {
            title: "Welcome to Our Church",
            subtitle: "A place of faith, hope, and love",
            backgroundImage: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80",
            overlayOpacity: 60,
            alignment: "center",
            showCTA: true,
            ctaText: "Join Us Sunday",
            ctaLink: "/locate",
            ctaSecondaryText: "Learn More",
            ctaSecondaryLink: "/about",
          },
        },
        {
          type: "ServiceTimes",
          props: {
            heading: "Join Us for Worship",
            services: [
              { name: "Sunday Worship", day: "Sunday", time: "9:00 AM & 11:00 AM", description: "Main worship service", location: "Main Sanctuary" },
              { name: "Bible Study", day: "Wednesday", time: "7:00 PM", description: "Midweek study", location: "Fellowship Hall" },
            ],
            style: "cards",
          },
        },
        {
          type: "ScriptureBlock",
          props: {
            verse: "For where two or three gather in my name, there am I with them.",
            reference: "Matthew 18:20",
            translation: "NIV",
            style: "card",
            showDivider: true,
          },
        },
        {
          type: "Cards",
          props: {
            heading: "Our Ministries",
            cards: [
              { title: "Worship", description: "Spirit-filled worship services", icon: "music", link: "/ministries" },
              { title: "Youth", description: "Programs for young people", icon: "users", link: "/ministries" },
              { title: "Outreach", description: "Serving our community", icon: "heart", link: "/ministries" },
            ],
            columns: "3",
          },
        },
        {
          type: "CTABanner",
          props: {
            heading: "Ready to Visit?",
            description: "We'd love to welcome you to our church family.",
            buttonText: "Plan Your Visit",
            buttonLink: "/new-here",
            backgroundColor: "#1e3a5f",
          },
        },
      ],
      root: {},
    },
  },
  {
    id: "landing-modern",
    name: "Modern Landing Page",
    description: "Clean, modern design with stats, testimonials, and dynamic content",
    category: "landing",
    data: {
      content: [
        {
          type: "Hero",
          props: {
            title: "Experience God's Love",
            subtitle: "Join a community that cares",
            backgroundImage: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80",
            overlayOpacity: 70,
            alignment: "center",
            showCTA: true,
            ctaText: "Find a Church",
            ctaLink: "/locate",
            ctaSecondaryText: "Watch Online",
            ctaSecondaryLink: "/watch",
          },
        },
        {
          type: "Stats",
          props: {
            stats: [
              { value: "50+", label: "Local Churches" },
              { value: "5000+", label: "Members" },
              { value: "25", label: "Years of Service" },
              { value: "100+", label: "Ministries" },
            ],
            backgroundColor: "#0a0f1a",
          },
        },
        {
          type: "Heading",
          props: {
            text: "What We Believe",
            level: "h2",
            alignment: "center",
          },
        },
        {
          type: "IconGrid",
          props: {
            heading: "",
            items: [
              { icon: "book", title: "Biblical Foundation", description: "Grounded in Scripture" },
              { icon: "globe", title: "Global Mission", description: "Reaching the world" },
              { icon: "users", title: "Community", description: "Supporting one another" },
              { icon: "heart", title: "Service", description: "Serving with love" },
            ],
            columns: "4",
          },
        },
        {
          type: "Testimonials",
          props: {
            heading: "Life-Changing Stories",
            testimonials: [
              { quote: "This church has transformed my life.", author: "Maria Santos", role: "Member since 2018", image: "" },
              { quote: "I found my spiritual family here.", author: "John Davis", role: "Youth Leader", image: "" },
            ],
          },
        },
        {
          type: "DonationCTA",
          props: {
            heading: "Support Our Mission",
            description: "Your generosity helps us reach more people with the Gospel.",
            amounts: "25, 50, 100, 250",
            customAmountLabel: "Custom",
            buttonText: "Give Now",
            buttonLink: "/give",
            showRecurring: true,
            backgroundColor: "#1e3a5f",
          },
        },
      ],
      root: {},
    },
  },

  // ============================================
  // EVENT PAGE TEMPLATES
  // ============================================
  {
    id: "event-conference",
    name: "Conference/Crusade Page",
    description: "Perfect for multi-day events, conferences, and crusades",
    category: "event",
    data: {
      content: [
        {
          type: "Hero",
          props: {
            title: "Annual Spiritual Conference",
            subtitle: "March 15-17, 2026 • Los Angeles Convention Center",
            backgroundImage: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80",
            overlayOpacity: 65,
            alignment: "center",
            showCTA: true,
            ctaText: "Register Now",
            ctaLink: "/register",
            ctaSecondaryText: "Event Schedule",
            ctaSecondaryLink: "#schedule",
          },
        },
        {
          type: "TextBlock",
          props: {
            content: "Join thousands of believers for three days of powerful worship, anointed teaching, and spiritual renewal. This year's theme focuses on 'Walking in Faith' with special guest speakers from around the world.",
            alignment: "center",
            size: "large",
          },
        },
        {
          type: "ScriptureBlock",
          props: {
            verse: "Now faith is confidence in what we hope for and assurance about what we do not see.",
            reference: "Hebrews 11:1",
            translation: "NIV",
            style: "highlight",
            showDivider: false,
          },
        },
        {
          type: "Timeline",
          props: {
            heading: "Event Schedule",
            items: [
              { date: "Day 1 - Friday", title: "Opening Night", description: "Registration, worship, and opening message", image: "" },
              { date: "Day 2 - Saturday", title: "Full Day Sessions", description: "Morning worship, workshops, and evening service", image: "" },
              { date: "Day 3 - Sunday", title: "Closing Celebration", description: "Final worship service and commissioning", image: "" },
            ],
            style: "left",
          },
        },
        {
          type: "ContactInfo",
          props: {
            heading: "Event Location",
            address: "Los Angeles Convention Center\n1201 S Figueroa St\nLos Angeles, CA 90015",
            phone: "+1 (555) 123-4567",
            email: "events@pmcc4thwatch.us",
            showMap: false,
          },
        },
        {
          type: "CTABanner",
          props: {
            heading: "Don't Miss Out!",
            description: "Early bird registration ends soon. Secure your spot today.",
            buttonText: "Register Now",
            buttonLink: "/register",
            backgroundColor: "#1e3a5f",
          },
        },
      ],
      root: {},
    },
  },
  {
    id: "event-worship",
    name: "Worship Event Page",
    description: "For special worship nights and praise services",
    category: "event",
    data: {
      content: [
        {
          type: "Hero",
          props: {
            title: "Night of Worship",
            subtitle: "An evening of praise and prayer",
            backgroundImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80",
            overlayOpacity: 70,
            alignment: "center",
            showCTA: true,
            ctaText: "RSVP Free",
            ctaLink: "/register",
            ctaSecondaryText: "Add to Calendar",
            ctaSecondaryLink: "#",
          },
        },
        {
          type: "ServiceTimes",
          props: {
            heading: "",
            services: [
              { name: "Night of Worship", day: "Friday, March 20", time: "7:00 PM", description: "Doors open at 6:30 PM", location: "Main Sanctuary" },
            ],
            style: "compact",
          },
        },
        {
          type: "TextBlock",
          props: {
            content: "Come as you are and experience the presence of God. This will be a powerful night of worship, prayer, and encounter. Bring your friends and family!",
            alignment: "center",
            size: "medium",
          },
        },
        {
          type: "MapEmbed",
          props: {
            heading: "Location",
            address: "PMCC 4th Watch, Los Angeles, CA",
            height: 400,
            zoom: 15,
            style: "roadmap",
          },
        },
      ],
      root: {},
    },
  },

  // ============================================
  // MINISTRY PAGE TEMPLATES
  // ============================================
  {
    id: "ministry-overview",
    name: "Ministry Overview Page",
    description: "Showcase all church ministries with descriptions and leaders",
    category: "ministry",
    data: {
      content: [
        {
          type: "Hero",
          props: {
            title: "Our Ministries",
            subtitle: "Find your place to serve and grow",
            backgroundImage: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80",
            overlayOpacity: 60,
            alignment: "center",
            showCTA: false,
            ctaText: "",
            ctaLink: "",
            ctaSecondaryText: "",
            ctaSecondaryLink: "",
          },
        },
        {
          type: "TextBlock",
          props: {
            content: "At PMCC 4th Watch, we believe everyone has a role to play in the body of Christ. Explore our ministries below and find where God is calling you to serve.",
            alignment: "center",
            size: "large",
          },
        },
        {
          type: "Cards",
          props: {
            heading: "Worship & Music",
            cards: [
              { title: "Choir Ministry", description: "Lifting voices in praise and worship", icon: "music", link: "/ministries/choir" },
              { title: "Instrumental", description: "Musicians serving through their gifts", icon: "music", link: "/ministries/instrumental" },
              { title: "Sound & Media", description: "Technical support for worship", icon: "settings", link: "/ministries/media" },
            ],
            columns: "3",
          },
        },
        {
          type: "Cards",
          props: {
            heading: "Discipleship",
            cards: [
              { title: "Bible Study", description: "Grow deeper in God's Word", icon: "book", link: "/ministries/bible-study" },
              { title: "Prayer Ministry", description: "Interceding for our community", icon: "heart", link: "/ministries/prayer" },
              { title: "New Believers", description: "Foundation for new Christians", icon: "users", link: "/ministries/new-believers" },
            ],
            columns: "3",
          },
        },
        {
          type: "CTABanner",
          props: {
            heading: "Ready to Get Involved?",
            description: "Contact us to learn more about serving in any of our ministries.",
            buttonText: "Contact Us",
            buttonLink: "/contact",
            backgroundColor: "#1e3a5f",
          },
        },
      ],
      root: {},
    },
  },

  // ============================================
  // ABOUT PAGE TEMPLATES
  // ============================================
  {
    id: "about-church",
    name: "About Our Church",
    description: "Church history, beliefs, and leadership",
    category: "about",
    data: {
      content: [
        {
          type: "Hero",
          props: {
            title: "About Us",
            subtitle: "Our story, our mission, our vision",
            backgroundImage: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80",
            overlayOpacity: 60,
            alignment: "center",
            showCTA: false,
            ctaText: "",
            ctaLink: "",
            ctaSecondaryText: "",
            ctaSecondaryLink: "",
          },
        },
        {
          type: "Heading",
          props: {
            text: "Our History",
            level: "h2",
            alignment: "center",
          },
        },
        {
          type: "TextBlock",
          props: {
            content: "The Pentecostal Missionary Church of Christ (4th Watch) was founded with a vision for holiness, evangelism, and service unto the Lord. Our journey began with a small group of believers committed to spreading the Gospel, and has grown into a global movement with churches across multiple continents.",
            alignment: "center",
            size: "medium",
          },
        },
        {
          type: "Timeline",
          props: {
            heading: "Our Journey",
            items: [
              { date: "1972", title: "Church Founded", description: "PMCC 4th Watch was established in the Philippines", image: "" },
              { date: "1985", title: "US District", description: "The US District was officially organized", image: "" },
              { date: "2000s", title: "Growth Era", description: "Expansion to multiple states", image: "" },
              { date: "Today", title: "Continuing Mission", description: "Still faithfully serving", image: "" },
            ],
            style: "alternating",
          },
        },
        {
          type: "ScriptureBlock",
          props: {
            verse: "Holiness and Service Unto The Lord",
            reference: "Our Motto",
            translation: "",
            style: "highlight",
            showDivider: false,
          },
        },
        {
          type: "FAQ",
          props: {
            heading: "Frequently Asked Questions",
            description: "Common questions about our church",
            faqs: [
              { question: "What denomination are you?", answer: "We are a Pentecostal church committed to apostolic teaching and holiness." },
              { question: "What are your beliefs?", answer: "We believe in the Bible as the inspired Word of God, salvation through Jesus Christ, and the baptism of the Holy Spirit." },
              { question: "How can I become a member?", answer: "Attend our New Believers class and speak with a pastor about membership." },
            ],
          },
        },
      ],
      root: {},
    },
  },

  // ============================================
  // CONTACT PAGE TEMPLATES
  // ============================================
  {
    id: "contact-full",
    name: "Contact Page",
    description: "Full contact page with form, map, and prayer requests",
    category: "contact",
    data: {
      content: [
        {
          type: "Hero",
          props: {
            title: "Contact Us",
            subtitle: "We'd love to hear from you",
            backgroundImage: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80",
            overlayOpacity: 70,
            alignment: "center",
            showCTA: false,
            ctaText: "",
            ctaLink: "",
            ctaSecondaryText: "",
            ctaSecondaryLink: "",
          },
        },
        {
          type: "ContactInfo",
          props: {
            heading: "Get In Touch",
            address: "123 Church Street\nLos Angeles, CA 90001",
            phone: "+1 (555) 123-4567",
            email: "info@pmcc4thwatch.us",
            showMap: false,
          },
        },
        {
          type: "MapEmbed",
          props: {
            heading: "Find Us",
            address: "Los Angeles Convention Center, Los Angeles, CA",
            height: 400,
            zoom: 15,
            style: "roadmap",
          },
        },
        {
          type: "PrayerRequestForm",
          props: {
            heading: "Submit a Prayer Request",
            description: "Let our prayer team lift you up in prayer.",
            showNameField: true,
            showEmailField: true,
            showPhoneField: false,
            categories: "Health, Family, Financial, Spiritual Growth, Other",
            submitButtonText: "Submit Request",
            successMessage: "Thank you! We will be praying for you.",
          },
        },
      ],
      root: {},
    },
  },

  // ============================================
  // GENERAL TEMPLATES
  // ============================================
  {
    id: "blank",
    name: "Blank Page",
    description: "Start with a clean slate",
    category: "general",
    data: {
      content: [],
      root: {},
    },
  },
  {
    id: "simple-content",
    name: "Simple Content Page",
    description: "Basic page with heading and text",
    category: "general",
    data: {
      content: [
        {
          type: "Heading",
          props: {
            text: "Page Title",
            level: "h1",
            alignment: "center",
          },
        },
        {
          type: "TextBlock",
          props: {
            content: "Add your content here...",
            alignment: "left",
            size: "medium",
          },
        },
      ],
      root: {},
    },
  },
];

export function getTemplatesByCategory(category: PuckTemplate["category"]): PuckTemplate[] {
  return puckTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): PuckTemplate | undefined {
  return puckTemplates.find(t => t.id === id);
}

export default puckTemplates;
