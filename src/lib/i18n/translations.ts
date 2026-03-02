export type Locale = "en" | "fil";

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.about": "About Us",
    "nav.events": "Events",
    "nav.ministries": "Ministries",
    "nav.media": "Media",
    "nav.give": "Give",
    "nav.contact": "Contact",
    "nav.locate": "Locate Churches",
    "nav.newHere": "I'm New Here",

    // Common
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.search": "Search",
    "common.close": "Close",
    "common.yes": "Yes",
    "common.no": "No",
    "common.or": "or",

    // Home Page
    "home.hero.title": "Holiness & Service",
    "home.hero.subtitle": "Unto The Lord",
    "home.hero.cta": "Locate Churches",
    "home.hero.secondaryCta": "I'm New Here",
    "home.welcome": "Welcome to PMCC 4th Watch",
    "home.mission": "Our Mission",
    "home.services": "Service Times",
    "home.events": "Upcoming Events",

    // Events
    "events.title": "Events",
    "events.upcoming": "Upcoming Events",
    "events.past": "Past Events",
    "events.register": "Register Now",
    "events.registerFree": "Register Free",
    "events.viewDetails": "View Details",
    "events.spotsLeft": "spots left",
    "events.soldOut": "Sold Out",
    "events.waitlist": "Join Waitlist",
    "events.onWaitlist": "You're on the waitlist",
    "events.position": "Position",

    // Registration
    "register.title": "Event Registration",
    "register.yourInfo": "Your Information",
    "register.name": "Full Name",
    "register.email": "Email Address",
    "register.phone": "Phone Number",
    "register.invitedBy": "Invited By",
    "register.submit": "Complete Registration",
    "register.success": "Registration Successful!",
    "register.successMessage": "You're registered! Check your email for your ticket.",
    "register.waitlistSuccess": "Added to Waitlist",
    "register.waitlistMessage": "You've been added to the waitlist. We'll notify you if a spot opens up.",
    "register.alreadyRegistered": "You're already registered for this event.",

    // Ticket
    "ticket.title": "Your Ticket",
    "ticket.code": "Ticket Code",
    "ticket.scanCode": "Scan this QR code at check-in",
    "ticket.print": "Print Ticket",
    "ticket.addToCalendar": "Add to Calendar",
    "ticket.status": "Status",
    "ticket.confirmed": "Confirmed",
    "ticket.waitlisted": "Waitlisted",
    "ticket.cancelled": "Cancelled",

    // Check-in
    "checkin.title": "Event Check-In",
    "checkin.scan": "Scan QR Code",
    "checkin.manual": "Enter Code Manually",
    "checkin.success": "Check-In Successful!",
    "checkin.welcome": "Welcome",
    "checkin.alreadyCheckedIn": "Already Checked In",
    "checkin.notFound": "Ticket Not Found",

    // Member Portal
    "member.login": "Member Login",
    "member.logout": "Logout",
    "member.dashboard": "Dashboard",
    "member.profile": "Profile",
    "member.inviteLink": "Your Invite Link",
    "member.copyLink": "Copy Link",
    "member.linkCopied": "Link copied!",
    "member.yourInvites": "Your Invites",
    "member.totalInvites": "Total Invites",
    "member.attended": "Attended",
    "member.baptized": "Baptized",

    // Church Info
    "church.name": "Pentecostal Missionary Church of Christ",
    "church.shortName": "PMCC 4th Watch",
    "church.motto": "Holiness & Service Unto The Lord",
    "church.usDistrict": "US District",

    // Footer
    "footer.quickLinks": "Quick Links",
    "footer.connect": "Connect With Us",
    "footer.contact": "Contact Us",
    "footer.rights": "All rights reserved",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",

    // Forms
    "form.required": "Required",
    "form.optional": "Optional",
    "form.invalidEmail": "Please enter a valid email",
    "form.invalidPhone": "Please enter a valid phone number",

    // Giving
    "give.title": "Give",
    "give.subtitle": "Support Our Mission",
    "give.description": "Your generosity helps us spread the Gospel and serve our community.",
    "give.oneTime": "One-time",
    "give.monthly": "Monthly",
    "give.giveNow": "Give Now",
    "give.otherAmount": "Other Amount",

    // Prayer
    "prayer.title": "Prayer Request",
    "prayer.submit": "Submit Prayer Request",
    "prayer.thankYou": "Thank you for sharing your prayer request!",
    "prayer.weArePraying": "We will be praying for you.",
  },
  fil: {
    // Navigation
    "nav.home": "Tahanan",
    "nav.about": "Tungkol Sa Amin",
    "nav.events": "Mga Okasyon",
    "nav.ministries": "Mga Ministeryo",
    "nav.media": "Media",
    "nav.give": "Mag-alay",
    "nav.contact": "Makipag-ugnayan",
    "nav.locate": "Hanapin ang mga Simbahan",
    "nav.newHere": "Bago Ako Dito",

    // Common
    "common.loading": "Naglo-load...",
    "common.error": "May nangyaring mali",
    "common.submit": "Isumite",
    "common.cancel": "Kanselahin",
    "common.save": "I-save",
    "common.delete": "Burahin",
    "common.edit": "I-edit",
    "common.view": "Tingnan",
    "common.back": "Bumalik",
    "common.next": "Susunod",
    "common.previous": "Nakaraan",
    "common.search": "Maghanap",
    "common.close": "Isara",
    "common.yes": "Oo",
    "common.no": "Hindi",
    "common.or": "o",

    // Home Page
    "home.hero.title": "Kabanalan at Paglilingkod",
    "home.hero.subtitle": "Sa Panginoon",
    "home.hero.cta": "Hanapin ang mga Simbahan",
    "home.hero.secondaryCta": "Bago Ako Dito",
    "home.welcome": "Maligayang Pagdating sa PMCC 4th Watch",
    "home.mission": "Ang Aming Misyon",
    "home.services": "Oras ng Pagsamba",
    "home.events": "Mga Paparating na Okasyon",

    // Events
    "events.title": "Mga Okasyon",
    "events.upcoming": "Mga Paparating na Okasyon",
    "events.past": "Mga Nakaraang Okasyon",
    "events.register": "Magpa-rehistro",
    "events.registerFree": "Magpa-rehistro ng Libre",
    "events.viewDetails": "Tingnan ang Detalye",
    "events.spotsLeft": "na slot ang natitira",
    "events.soldOut": "Sold Out",
    "events.waitlist": "Sumali sa Waitlist",
    "events.onWaitlist": "Nasa waitlist ka",
    "events.position": "Posisyon",

    // Registration
    "register.title": "Pagpapa-rehistro sa Okasyon",
    "register.yourInfo": "Ang Iyong Impormasyon",
    "register.name": "Buong Pangalan",
    "register.email": "Email Address",
    "register.phone": "Numero ng Telepono",
    "register.invitedBy": "Inimbitahan Ni",
    "register.submit": "Kumpletuhin ang Pagpa-rehistro",
    "register.success": "Matagumpay ang Pagpa-rehistro!",
    "register.successMessage": "Naka-rehistro ka na! Tingnan ang iyong email para sa iyong ticket.",
    "register.waitlistSuccess": "Naidagdag sa Waitlist",
    "register.waitlistMessage": "Naidagdag ka sa waitlist. Aabisuhan ka namin kung may bumukas na slot.",
    "register.alreadyRegistered": "Naka-rehistro ka na sa okasyong ito.",

    // Ticket
    "ticket.title": "Ang Iyong Ticket",
    "ticket.code": "Ticket Code",
    "ticket.scanCode": "I-scan ang QR code sa check-in",
    "ticket.print": "I-print ang Ticket",
    "ticket.addToCalendar": "Idagdag sa Kalendaryo",
    "ticket.status": "Katayuan",
    "ticket.confirmed": "Kumpirmado",
    "ticket.waitlisted": "Nasa Waitlist",
    "ticket.cancelled": "Kanselado",

    // Check-in
    "checkin.title": "Event Check-In",
    "checkin.scan": "I-scan ang QR Code",
    "checkin.manual": "Ilagay ang Code",
    "checkin.success": "Matagumpay ang Check-In!",
    "checkin.welcome": "Maligayang Pagdating",
    "checkin.alreadyCheckedIn": "Na-check in na",
    "checkin.notFound": "Hindi Nahanap ang Ticket",

    // Member Portal
    "member.login": "Mag-login",
    "member.logout": "Mag-logout",
    "member.dashboard": "Dashboard",
    "member.profile": "Profile",
    "member.inviteLink": "Ang Iyong Invite Link",
    "member.copyLink": "Kopyahin ang Link",
    "member.linkCopied": "Nakopya ang link!",
    "member.yourInvites": "Ang Iyong mga Imbitasyon",
    "member.totalInvites": "Kabuuang Imbitasyon",
    "member.attended": "Dumalo",
    "member.baptized": "Nabautismuhan",

    // Church Info
    "church.name": "Pentecostal Missionary Church of Christ",
    "church.shortName": "PMCC 4th Watch",
    "church.motto": "Kabanalan at Paglilingkod Sa Panginoon",
    "church.usDistrict": "US District",

    // Footer
    "footer.quickLinks": "Mga Mabilisang Link",
    "footer.connect": "Makipag-ugnayan Sa Amin",
    "footer.contact": "Kontakin Kami",
    "footer.rights": "Lahat ng karapatan ay nakalaan",
    "footer.privacy": "Patakaran sa Privacy",
    "footer.terms": "Mga Tuntunin ng Serbisyo",

    // Forms
    "form.required": "Kinakailangan",
    "form.optional": "Opsyonal",
    "form.invalidEmail": "Maglagay ng wastong email",
    "form.invalidPhone": "Maglagay ng wastong numero ng telepono",

    // Giving
    "give.title": "Mag-alay",
    "give.subtitle": "Suportahan ang Aming Misyon",
    "give.description": "Ang iyong pagbibigay ay tumutulong sa pagpapalaganap ng Ebanghelyo at paglilingkod sa aming komunidad.",
    "give.oneTime": "Isang beses",
    "give.monthly": "Buwanan",
    "give.giveNow": "Mag-alay Ngayon",
    "give.otherAmount": "Ibang Halaga",

    // Prayer
    "prayer.title": "Kahilingan sa Panalangin",
    "prayer.submit": "Isumite ang Kahilingan",
    "prayer.thankYou": "Salamat sa pagbabahagi ng iyong kahilingan sa panalangin!",
    "prayer.weArePraying": "Ipapanalangin ka namin.",
  },
} as const;

export function getTranslation(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] || translations.en[key] || key;
}

export const localeNames: Record<Locale, string> = {
  en: "English",
  fil: "Filipino",
};

export const defaultLocale: Locale = "en";
