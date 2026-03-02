import { getPayload } from "payload";
import config from "../src/payload.config";

const mockEvents = [
  {
    title: "Spiritual Empowerment Conference 2026",
    subtitle: "Experience Transformation Through Faith",
    slug: "spiritual-empowerment-conference-2026",
    description: `Join us for a powerful three-day conference designed to strengthen your spiritual foundation and empower you in your walk with God.

This year's conference features dynamic speakers, powerful worship sessions, and life-changing teachings on faith, prayer, and spiritual growth.

Whether you're a new believer or have been walking with the Lord for decades, this conference will inspire and equip you for the journey ahead. Come expecting to receive fresh revelation, divine encounters, and lasting transformation.

The conference will include morning and evening sessions, breakout workshops, and dedicated times of prayer and ministry. Don't miss this opportunity to grow in your faith and connect with believers from across the region.`,
    eventDate: new Date("2026-03-28T09:00:00").toISOString(),
    endDate: new Date("2026-03-30T17:00:00").toISOString(),
    location: "PMCC 4th Watch Los Angeles",
    address: "1234 Main Street, Los Angeles, CA 90001",
    eventType: "conference",
    isPublished: true,
    showOnHomepage: true,
    homepageOrder: 1,
    isFeatured: true,
    contactEmail: "conference@pmcc4thwatch.us",
    contactPhone: "+1 (213) 555-0100",
    heroImageUrl: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1200&q=80",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&q=80",
        caption: "Powerful worship sessions",
      },
      {
        url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80",
        caption: "Fellowship and community",
      },
      {
        url: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80",
        caption: "Biblical teaching and instruction",
      },
    ],
  },
  {
    title: "Youth Revival Night",
    subtitle: "A Night of Worship and Fire for the Next Generation",
    slug: "youth-revival-night-2026",
    description: `Calling all young people! Join us for an explosive night of worship, prayer, and the Word of God.

This event is designed specifically for youth and young adults who are hungry for more of God. Experience powerful praise and worship, hear from dynamic youth speakers, and connect with other young believers in your community.

The night will feature contemporary worship, interactive sessions, and opportunities for prayer and ministry. Whether you're seeking direction for your life, looking to deepen your faith, or simply want to worship with other young believers, this is your night.

Invite your friends and family! This is a free event open to all youth ages 13-25.`,
    eventDate: new Date("2026-04-15T18:00:00").toISOString(),
    endDate: new Date("2026-04-15T22:00:00").toISOString(),
    location: "PMCC 4th Watch San Francisco",
    address: "567 Oak Avenue, San Francisco, CA 94102",
    eventType: "youth",
    isPublished: true,
    showOnHomepage: true,
    homepageOrder: 2,
    isFeatured: false,
    contactEmail: "youth@pmcc4thwatch.us",
    contactPhone: "+1 (415) 555-0200",
    heroImageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&q=80",
        caption: "Dynamic youth worship",
      },
      {
        url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80",
        caption: "Youth fellowship and connection",
      },
      {
        url: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=1200&q=80",
        caption: "Community and friendship",
      },
    ],
  },
  {
    title: "Home Free Global Crusade - California",
    subtitle: "Bringing Souls Home to Christ",
    slug: "hfgc-california-2026",
    description: `The Home Free Global Crusade is PMCC 4th Watch's flagship evangelism event. Join thousands of believers as we come together to share the Gospel and witness souls come to Christ.

This crusade features powerful preaching, healing services, testimonies that will strengthen your faith, and opportunities to experience God's presence in a powerful way.

The event is free and open to everyone - bring your family, friends, neighbors, and coworkers! Transportation will be provided from select locations. Childcare is available during all sessions.

Experience the power of corporate worship as thousands lift their voices in praise. Witness the transformative power of the Gospel as lives are changed and hearts are renewed. This is more than an event - it's a movement.`,
    eventDate: new Date("2026-05-01T16:00:00").toISOString(),
    endDate: new Date("2026-05-03T21:00:00").toISOString(),
    location: "Rose Bowl Stadium",
    address: "1001 Rose Bowl Dr, Pasadena, CA 91103",
    eventType: "crusade",
    isPublished: true,
    showOnHomepage: true,
    homepageOrder: 3,
    isFeatured: true,
    contactEmail: "crusade@pmcc4thwatch.us",
    contactPhone: "+1 (626) 555-0300",
    heroImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
        caption: "Massive crowd gathering",
      },
      {
        url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80",
        caption: "Powerful preaching",
      },
      {
        url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&q=80",
        caption: "Night of worship and praise",
      },
    ],
  },
  {
    title: "Ministers & Workers Training",
    subtitle: "Equipping the Saints for Kingdom Work",
    slug: "ministers-workers-training-2026",
    description: `A comprehensive training program for ministers, church workers, and aspiring leaders. Learn effective ministry strategies, develop your leadership skills, and grow in your calling.

Topics include: Biblical foundations of ministry, pastoral care, evangelism methods, worship leading, and administrative excellence. Certificate of completion provided to all participants.

This intensive two-day training will provide practical tools and biblical principles to help you serve more effectively in your local church and community. Whether you're a seasoned minister or just beginning your journey in ministry, this training will equip you for greater impact.

Meals are provided. Please bring your Bible, notebook, and a heart ready to learn and grow.`,
    eventDate: new Date("2026-04-25T08:00:00").toISOString(),
    endDate: new Date("2026-04-26T17:00:00").toISOString(),
    location: "PMCC 4th Watch Training Center",
    address: "890 Mission Road, San Diego, CA 92101",
    eventType: "training",
    isPublished: true,
    showOnHomepage: true,
    homepageOrder: 4,
    isFeatured: false,
    contactEmail: "training@pmcc4thwatch.us",
    contactPhone: "+1 (619) 555-0400",
    heroImageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=80",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80",
        caption: "Interactive training sessions",
      },
      {
        url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
        caption: "Small group discussions",
      },
      {
        url: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=1200&q=80",
        caption: "Leadership development",
      },
    ],
  },
];

async function uploadImage(payload: Awaited<ReturnType<typeof getPayload>>, imageUrl: string, altText: string, fileName: string) {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    const mediaDoc = await payload.create({
      collection: "media",
      data: {
        alt: altText,
      },
      file: {
        data: Buffer.from(imageBuffer),
        mimetype: "image/jpeg",
        name: fileName,
        size: imageBuffer.byteLength,
      },
    });

    return mediaDoc.id;
  } catch (error) {
    console.log(`   ⚠️  Could not upload image: ${fileName}`, error);
    return null;
  }
}

async function seedNewsEvents() {
  console.log("🌱 Starting seed process for news-events...");

  try {
    const payload = await getPayload({ config });
    console.log("✅ Connected to Payload/MongoDB");

    // First, clear existing news-events
    console.log("🗑️  Clearing existing news-events...");
    const existing = await payload.find({
      collection: "news-events",
      limit: 100,
    });

    for (const doc of existing.docs) {
      await payload.delete({
        collection: "news-events",
        id: doc.id,
      });
    }
    console.log(`   Deleted ${existing.docs.length} existing events`);

    // Create new events
    console.log("📝 Creating mock news-events with images...");

    for (const event of mockEvents) {
      console.log(`\n📅 Processing: ${event.title}`);

      // Upload hero image
      console.log("   Uploading hero image...");
      const heroImageId = await uploadImage(
        payload,
        event.heroImageUrl,
        event.title,
        `${event.slug}-hero.jpg`
      );

      if (heroImageId) {
        console.log(`   ✅ Hero image uploaded`);
      }

      // Upload gallery images
      const galleryItems: Array<{ image: string | number; caption: string }> = [];

      for (let i = 0; i < event.galleryImages.length; i++) {
        const galleryImg = event.galleryImages[i];
        console.log(`   Uploading gallery image ${i + 1}/${event.galleryImages.length}...`);

        const galleryImageId = await uploadImage(
          payload,
          galleryImg.url,
          galleryImg.caption || event.title,
          `${event.slug}-gallery-${i + 1}.jpg`
        );

        if (galleryImageId) {
          galleryItems.push({
            image: galleryImageId,
            caption: galleryImg.caption,
          });
          console.log(`   ✅ Gallery image ${i + 1} uploaded`);
        }
      }

      // Create the news-event
      const created = await payload.create({
        collection: "news-events",
        data: {
          title: event.title,
          subtitle: event.subtitle,
          slug: event.slug,
          description: event.description,
          eventDate: event.eventDate,
          endDate: event.endDate,
          location: event.location,
          address: event.address,
          eventType: event.eventType,
          isPublished: event.isPublished,
          showOnHomepage: event.showOnHomepage,
          homepageOrder: event.homepageOrder,
          isFeatured: event.isFeatured,
          heroImage: heroImageId,
          gallery: galleryItems,
          contactEmail: event.contactEmail,
          contactPhone: event.contactPhone,
        },
      });

      console.log(`   ✅ Created event: ${created.title} (ID: ${created.id})`);
    }

    console.log("\n🎉 Seed completed successfully!");
    console.log(`   Created ${mockEvents.length} news-events with images`);

    // Verify by fetching homepage events
    const homepageEvents = await payload.find({
      collection: "news-events",
      where: {
        and: [
          { isPublished: { equals: true } },
          { showOnHomepage: { equals: true } },
        ],
      },
      sort: "homepageOrder",
      depth: 2,
    });

    console.log(`\n📊 Verification: ${homepageEvents.totalDocs} events ready for homepage`);

    for (const evt of homepageEvents.docs) {
      const gallery = evt.gallery as Array<{ image: unknown; caption: string }> | undefined;
      console.log(`   - ${evt.title} (${gallery?.length || 0} gallery images)`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedNewsEvents();
