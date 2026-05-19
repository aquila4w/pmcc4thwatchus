export interface ChurchSiteData {
  site: {
    id: string;
    church: string;
    published: boolean;
    template: string;
    heroImage?: { url: string; alt?: string } | null;
    welcomeTitle: string;
    welcomeText?: unknown;
    missionStatement?: string;
    serviceSchedule: {
      day: string;
      time: string;
      serviceName: string;
    }[];
    pastors: {
      name: string;
      title?: string;
      photo?: { url: string; alt?: string } | null;
      bio?: string;
    }[];
    aboutContent?: unknown;
    history?: unknown;
    beliefs?: unknown;
    gallery: {
      image: { url: string; alt?: string };
      caption?: string;
    }[];
    socialLinks: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
      website?: string;
    };
    customColors: {
      primaryColor?: string;
      accentColor?: string;
    };
    latestUpdates: {
      title: string;
      content?: string;
      date?: string;
      image?: { url: string; alt?: string } | null;
      link?: string;
    }[];
  };
  church: {
    id: string;
    name: string;
    slug: string;
    address?: string;
    city: string;
    state: string;
    zip?: string;
    phone?: string;
    email?: string;
    image?: { url: string; alt?: string } | null;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
}

export interface TemplateConfig {
  primaryBg: string;
  primaryText: string;
  accentBg: string;
  accentText: string;
  accentHover: string;
  heroGradient: string;
  cardBg: string;
  cardBorder: string;
  headerBg: string;
  footerBg: string;
  sectionAlt: string;
  fontSerif: string;
  borderRadius: string;
  buttonRadius: string;
}

export const THEME_LABELS: Record<string, string> = {
  modern: "Modern (Navy & Gold)",
  classic: "Classic (Brown & Warm)",
  bold: "Bold (Dark & Orange)",
  warm: "Warm (Green & Amber)",
  grace: "Grace (Lavender & White)",
  heritage: "Heritage (Deep Red & Cream)",
  radiance: "Radiance (Sunrise Gold)",
  harmony: "Harmony (Teal & Coral)",
  summit: "Summit (Steel Blue & Silver)",
  ember: "Ember (Burgundy & Copper)",
  covenant: "Covenant (Indigo & White)",
  oasis: "Oasis (Desert Tan & Teal)",
  gathering: "Gathering (Plum & Gold)",
  horizon: "Horizon (Ocean Blue & Sand)",
  elevation: "Elevation (Charcoal & Lime)",
  sanctuary: "Sanctuary (Forest & Cream)",
  pinnacle: "Pinnacle (Slate & Rose)",
  cornerstone: "Cornerstone (Stone Gray & Navy)",
  daybreak: "Daybreak (Dawn Pink & White)",
  heritageGold: "Heritage Gold (Black & Gold)",
};

export const TEMPLATES: Record<string, TemplateConfig> = {
  // 1. Modern — Navy & Gold, clean corporate feel
  modern: {
    primaryBg: "bg-[#1a365d]",
    primaryText: "text-[#1a365d]",
    accentBg: "bg-[#c9a84c]",
    accentText: "text-[#c9a84c]",
    accentHover: "hover:bg-[#b8963f]",
    heroGradient: "from-[#1a365d] to-[#2d4a7a]",
    cardBg: "bg-white dark:bg-slate-900",
    cardBorder: "border-slate-200 dark:border-slate-700",
    headerBg: "bg-[#1a365d]",
    footerBg: "bg-[#0f1f33]",
    sectionAlt: "bg-slate-50 dark:bg-slate-800/50",
    fontSerif: "font-serif",
    borderRadius: "rounded-lg",
    buttonRadius: "rounded-lg",
  },

  // 2. Classic — Brown & Warm, traditional church
  classic: {
    primaryBg: "bg-[#2c1810]",
    primaryText: "text-[#2c1810]",
    accentBg: "bg-[#8b4513]",
    accentText: "text-[#8b4513]",
    accentHover: "hover:bg-[#7a3c10]",
    heroGradient: "from-[#2c1810] to-[#4a2c17]",
    cardBg: "bg-amber-50 dark:bg-stone-900",
    cardBorder: "border-amber-200 dark:border-stone-700",
    headerBg: "bg-[#2c1810]",
    footerBg: "bg-[#1a0f09]",
    sectionAlt: "bg-amber-50/50 dark:bg-stone-800/50",
    fontSerif: "font-serif",
    borderRadius: "rounded",
    buttonRadius: "rounded",
  },

  // 3. Bold — Dark & Orange, dramatic contemporary
  bold: {
    primaryBg: "bg-[#0a0a0a]",
    primaryText: "text-[#0a0a0a]",
    accentBg: "bg-[#ff6b35]",
    accentText: "text-[#ff6b35]",
    accentHover: "hover:bg-[#e85a28]",
    heroGradient: "from-[#0a0a0a] to-[#1a1a2e]",
    cardBg: "bg-[#111] dark:bg-[#1a1a1a]",
    cardBorder: "border-[#333]",
    headerBg: "bg-[#0a0a0a]",
    footerBg: "bg-[#050505]",
    sectionAlt: "bg-[#111]/50",
    fontSerif: "font-sans",
    borderRadius: "rounded-none",
    buttonRadius: "rounded",
  },

  // 4. Warm — Green & Amber, friendly organic
  warm: {
    primaryBg: "bg-[#3d5a40]",
    primaryText: "text-[#3d5a40]",
    accentBg: "bg-[#dda15e]",
    accentText: "text-[#dda15e]",
    accentHover: "hover:bg-[#cc9048]",
    heroGradient: "from-[#3d5a40] to-[#5a7a5e]",
    cardBg: "bg-white dark:bg-emerald-950/30",
    cardBorder: "border-emerald-200 dark:border-emerald-800",
    headerBg: "bg-[#3d5a40]",
    footerBg: "bg-[#2a3d2c]",
    sectionAlt: "bg-emerald-50/50 dark:bg-emerald-900/20",
    fontSerif: "font-serif",
    borderRadius: "rounded-xl",
    buttonRadius: "rounded-full",
  },

  // 5. Grace — Soft lavender & white, gentle feminine
  grace: {
    primaryBg: "bg-[#5b4a6e]",
    primaryText: "text-[#5b4a6e]",
    accentBg: "bg-[#a78bba]",
    accentText: "text-[#a78bba]",
    accentHover: "hover:bg-[#967aaa]",
    heroGradient: "from-[#5b4a6e] to-[#7b6a8e]",
    cardBg: "bg-white dark:bg-purple-950/20",
    cardBorder: "border-purple-100 dark:border-purple-900/40",
    headerBg: "bg-[#5b4a6e]",
    footerBg: "bg-[#3d2f50]",
    sectionAlt: "bg-purple-50/50 dark:bg-purple-950/10",
    fontSerif: "font-serif",
    borderRadius: "rounded-xl",
    buttonRadius: "rounded-full",
  },

  // 6. Heritage — Deep red & cream, traditional American church
  heritage: {
    primaryBg: "bg-[#7a1b1b]",
    primaryText: "text-[#7a1b1b]",
    accentBg: "bg-[#d4a853]",
    accentText: "text-[#d4a853]",
    accentHover: "hover:bg-[#c2973f]",
    heroGradient: "from-[#7a1b1b] to-[#5a1010]",
    cardBg: "bg-[#faf6ee] dark:bg-stone-900",
    cardBorder: "border-red-200 dark:border-red-900/40",
    headerBg: "bg-[#7a1b1b]",
    footerBg: "bg-[#4a0e0e]",
    sectionAlt: "bg-[#faf6ee]/50 dark:bg-stone-800/50",
    fontSerif: "font-serif",
    borderRadius: "rounded",
    buttonRadius: "rounded",
  },

  // 7. Radiance — Sunrise gold & warm, uplifting bright
  radiance: {
    primaryBg: "bg-[#b8860b]",
    primaryText: "text-[#b8860b]",
    accentBg: "bg-[#e8a020]",
    accentText: "text-[#e8a020]",
    accentHover: "hover:bg-[#d09018]",
    heroGradient: "from-[#b8860b] to-[#d4a030]",
    cardBg: "bg-[#fffef5] dark:bg-yellow-950/20",
    cardBorder: "border-yellow-200 dark:border-yellow-900/40",
    headerBg: "bg-[#b8860b]",
    footerBg: "bg-[#8a6508]",
    sectionAlt: "bg-[#fffef5] dark:bg-yellow-950/10",
    fontSerif: "font-serif",
    borderRadius: "rounded-xl",
    buttonRadius: "rounded-xl",
  },

  // 8. Harmony — Teal & coral, balanced coastal
  harmony: {
    primaryBg: "bg-[#1a7a6d]",
    primaryText: "text-[#1a7a6d]",
    accentBg: "bg-[#e07a5f]",
    accentText: "text-[#e07a5f]",
    accentHover: "hover:bg-[#cc6a50]",
    heroGradient: "from-[#1a7a6d] to-[#2a9a8d]",
    cardBg: "bg-white dark:bg-teal-950/20",
    cardBorder: "border-teal-200 dark:border-teal-800",
    headerBg: "bg-[#1a7a6d]",
    footerBg: "bg-[#0f5a50]",
    sectionAlt: "bg-teal-50/50 dark:bg-teal-900/20",
    fontSerif: "font-sans",
    borderRadius: "rounded-lg",
    buttonRadius: "rounded-lg",
  },

  // 9. Summit — Steel blue & silver, trustworthy professional
  summit: {
    primaryBg: "bg-[#4a6fa5]",
    primaryText: "text-[#4a6fa5]",
    accentBg: "bg-[#8899aa]",
    accentText: "text-[#8899aa]",
    accentHover: "hover:bg-[#778899]",
    heroGradient: "from-[#4a6fa5] to-[#3a5f95]",
    cardBg: "bg-[#f8f9fb] dark:bg-slate-900",
    cardBorder: "border-slate-300 dark:border-slate-700",
    headerBg: "bg-[#4a6fa5]",
    footerBg: "bg-[#2a4a75]",
    sectionAlt: "bg-[#f0f3f7] dark:bg-slate-800/50",
    fontSerif: "font-sans",
    borderRadius: "rounded-lg",
    buttonRadius: "rounded-lg",
  },

  // 10. Ember — Burgundy & copper, warm rich
  ember: {
    primaryBg: "bg-[#6b1d3a]",
    primaryText: "text-[#6b1d3a]",
    accentBg: "bg-[#b87333]",
    accentText: "text-[#b87333]",
    accentHover: "hover:bg-[#a06328]",
    heroGradient: "from-[#6b1d3a] to-[#4a1028]",
    cardBg: "bg-[#fdf8f4] dark:bg-rose-950/20",
    cardBorder: "border-rose-200 dark:border-rose-900/40",
    headerBg: "bg-[#6b1d3a]",
    footerBg: "bg-[#4a1028]",
    sectionAlt: "bg-[#fdf8f4] dark:bg-rose-950/10",
    fontSerif: "font-serif",
    borderRadius: "rounded-lg",
    buttonRadius: "rounded-lg",
  },

  // 11. Covenant — Indigo & white, clean faithful
  covenant: {
    primaryBg: "bg-[#283593]",
    primaryText: "text-[#283593]",
    accentBg: "bg-[#5c6bc0]",
    accentText: "text-[#5c6bc0]",
    accentHover: "hover:bg-[#4a5ab0]",
    heroGradient: "from-[#283593] to-[#3949ab]",
    cardBg: "bg-white dark:bg-indigo-950/20",
    cardBorder: "border-indigo-100 dark:border-indigo-900/40",
    headerBg: "bg-[#283593]",
    footerBg: "bg-[#1a237e]",
    sectionAlt: "bg-indigo-50/50 dark:bg-indigo-950/10",
    fontSerif: "font-serif",
    borderRadius: "rounded",
    buttonRadius: "rounded",
  },

  // 12. Oasis — Desert tan & teal, southwestern
  oasis: {
    primaryBg: "bg-[#8b7355]",
    primaryText: "text-[#8b7355]",
    accentBg: "bg-[#2e8b8b]",
    accentText: "text-[#2e8b8b]",
    accentHover: "hover:bg-[#257a7a]",
    heroGradient: "from-[#8b7355] to-[#6a5a42]",
    cardBg: "bg-[#faf6f0] dark:bg-stone-900",
    cardBorder: "border-amber-200 dark:border-stone-700",
    headerBg: "bg-[#8b7355]",
    footerBg: "bg-[#6a5a42]",
    sectionAlt: "bg-[#faf6f0] dark:bg-stone-800/50",
    fontSerif: "font-serif",
    borderRadius: "rounded-lg",
    buttonRadius: "rounded-lg",
  },

  // 13. Gathering — Plum & gold, welcoming warm
  gathering: {
    primaryBg: "bg-[#4a2060]",
    primaryText: "text-[#4a2060]",
    accentBg: "bg-[#d4a030]",
    accentText: "text-[#d4a030]",
    accentHover: "hover:bg-[#c09020]",
    heroGradient: "from-[#4a2060] to-[#6a3090]",
    cardBg: "bg-[#fdf8ff] dark:bg-purple-950/20",
    cardBorder: "border-purple-100 dark:border-purple-900/40",
    headerBg: "bg-[#4a2060]",
    footerBg: "bg-[#2a1040]",
    sectionAlt: "bg-purple-50/50 dark:bg-purple-950/10",
    fontSerif: "font-serif",
    borderRadius: "rounded-xl",
    buttonRadius: "rounded-lg",
  },

  // 14. Horizon — Ocean blue & sand, coastal calm
  horizon: {
    primaryBg: "bg-[#1e6091]",
    primaryText: "text-[#1e6091]",
    accentBg: "bg-[#d4a574]",
    accentText: "text-[#d4a574]",
    accentHover: "hover:bg-[#c0945a]",
    heroGradient: "from-[#1e6091] to-[#2a80b1]",
    cardBg: "bg-[#f8fbff] dark:bg-sky-950/20",
    cardBorder: "border-sky-100 dark:border-sky-900/40",
    headerBg: "bg-[#1e6091]",
    footerBg: "bg-[#0f4061]",
    sectionAlt: "bg-sky-50/50 dark:bg-sky-900/10",
    fontSerif: "font-sans",
    borderRadius: "rounded-xl",
    buttonRadius: "rounded-xl",
  },

  // 15. Elevation — Charcoal & lime, modern youth
  elevation: {
    primaryBg: "bg-[#1c1c1c]",
    primaryText: "text-[#1c1c1c]",
    accentBg: "bg-[#84cc16]",
    accentText: "text-[#84cc16]",
    accentHover: "hover:bg-[#72b810]",
    heroGradient: "from-[#1c1c1c] to-[#2c2c2c]",
    cardBg: "bg-[#fafafa] dark:bg-neutral-900",
    cardBorder: "border-neutral-200 dark:border-neutral-800",
    headerBg: "bg-[#1c1c1c]",
    footerBg: "bg-[#0c0c0c]",
    sectionAlt: "bg-neutral-50 dark:bg-neutral-800/50",
    fontSerif: "font-sans",
    borderRadius: "rounded-none",
    buttonRadius: "rounded-none",
  },

  // 16. Sanctuary — Forest green & cream, peaceful
  sanctuary: {
    primaryBg: "bg-[#2d5a3d]",
    primaryText: "text-[#2d5a3d]",
    accentBg: "bg-[#8fbc8f]",
    accentText: "text-[#8fbc8f]",
    accentHover: "hover:bg-[#7aac7a]",
    heroGradient: "from-[#2d5a3d] to-[#1d4a2d]",
    cardBg: "bg-[#f8faf5] dark:bg-green-950/20",
    cardBorder: "border-green-200 dark:border-green-900/40",
    headerBg: "bg-[#2d5a3d]",
    footerBg: "bg-[#1d3a2d]",
    sectionAlt: "bg-green-50/50 dark:bg-green-900/10",
    fontSerif: "font-serif",
    borderRadius: "rounded-lg",
    buttonRadius: "rounded-lg",
  },

  // 17. Pinnacle — Slate & rose, elegant refined
  pinnacle: {
    primaryBg: "bg-[#3d4451]",
    primaryText: "text-[#3d4451]",
    accentBg: "bg-[#c77d8a]",
    accentText: "text-[#c77d8a]",
    accentHover: "hover:bg-[#b06d7a]",
    heroGradient: "from-[#3d4451] to-[#4d5461]",
    cardBg: "bg-[#f8f7f9] dark:bg-slate-900",
    cardBorder: "border-slate-200 dark:border-slate-700",
    headerBg: "bg-[#3d4451]",
    footerBg: "bg-[#2d3441]",
    sectionAlt: "bg-[#f4f3f5] dark:bg-slate-800/50",
    fontSerif: "font-serif",
    borderRadius: "rounded-xl",
    buttonRadius: "rounded-xl",
  },

  // 18. Cornerstone — Stone gray & navy, solid dependable
  cornerstone: {
    primaryBg: "bg-[#37474f]",
    primaryText: "text-[#37474f]",
    accentBg: "bg-[#1a365d]",
    accentText: "text-[#1a365d]",
    accentHover: "hover:bg-[#142a4a]",
    heroGradient: "from-[#37474f] to-[#263238]",
    cardBg: "bg-[#f5f7f8] dark:bg-slate-900",
    cardBorder: "border-slate-300 dark:border-slate-700",
    headerBg: "bg-[#37474f]",
    footerBg: "bg-[#263238]",
    sectionAlt: "bg-[#eceff1] dark:bg-slate-800/50",
    fontSerif: "font-sans",
    borderRadius: "rounded",
    buttonRadius: "rounded",
  },

  // 19. Daybreak — Dawn pink & white, fresh hopeful
  daybreak: {
    primaryBg: "bg-[#c25a7c]",
    primaryText: "text-[#c25a7c]",
    accentBg: "bg-[#e8a0b8]",
    accentText: "text-[#e8a0b8]",
    accentHover: "hover:bg-[#d890a8]",
    heroGradient: "from-[#c25a7c] to-[#d87a9c]",
    cardBg: "bg-[#fff8fa] dark:bg-pink-950/20",
    cardBorder: "border-pink-100 dark:border-pink-900/40",
    headerBg: "bg-[#c25a7c]",
    footerBg: "bg-[#9a3a5c]",
    sectionAlt: "bg-pink-50/50 dark:bg-pink-900/10",
    fontSerif: "font-serif",
    borderRadius: "rounded-2xl",
    buttonRadius: "rounded-full",
  },

  // 20. Heritage Gold — Black & gold, premium distinguished
  heritageGold: {
    primaryBg: "bg-[#1a1a1a]",
    primaryText: "text-[#1a1a1a]",
    accentBg: "bg-[#c5a44e]",
    accentText: "text-[#c5a44e]",
    accentHover: "hover:bg-[#b09440]",
    heroGradient: "from-[#1a1a1a] to-[#2a2a2a]",
    cardBg: "bg-[#1e1e1e] dark:bg-[#141414]",
    cardBorder: "border-[#333]",
    headerBg: "bg-[#1a1a1a]",
    footerBg: "bg-[#0a0a0a]",
    sectionAlt: "bg-[#222]/80",
    fontSerif: "font-serif",
    borderRadius: "rounded",
    buttonRadius: "rounded",
  },
};
