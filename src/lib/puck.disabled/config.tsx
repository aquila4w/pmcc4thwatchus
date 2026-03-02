"use client";

import type { Config } from "@measured/puck";
import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  ChevronRight,
  ChevronDown,
  Play,
  Quote,
  Mail,
  Phone,
  Clock,
  Image as ImageIcon,
  X,
  BookOpen,
  Mic,
  Send,
  HandHeart,
} from "lucide-react";

// Types for props
type GalleryProps = {
  heading?: string;
  images: Array<{ src: string; alt: string; caption?: string }>;
  columns: "2" | "3" | "4";
  aspectRatio: "square" | "landscape" | "portrait";
  enableLightbox: boolean;
};

type AccordionProps = {
  heading?: string;
  items: Array<{ title: string; content: string }>;
  allowMultiple: boolean;
  style: "default" | "bordered" | "separated";
};

type PrayerRequestFormProps = {
  heading: string;
  description?: string;
  showNameField: boolean;
  showEmailField: boolean;
  showPhoneField: boolean;
  categories: string;
  submitButtonText: string;
  successMessage: string;
};

type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type TextSize = "small" | "medium" | "large";
type ImageSize = "small" | "medium" | "large" | "full";
type SpacerHeight = "small" | "medium" | "large" | "xlarge";
type ColumnCount = "2" | "3" | "4";

interface CardItem {
  title: string;
  description: string;
  icon?: string;
  link?: string;
}

interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  image?: string;
}

interface StatItem {
  value: string;
  label: string;
}

// Accordion Component
function AccordionItem({
  title,
  content,
  isOpen,
  onToggle,
}: {
  title: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-4 px-6 text-left font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-slate-600 dark:text-slate-300">
          {content}
        </div>
      )}
    </div>
  );
}

function AccordionComponent({
  items,
  allowMultiple,
  style,
  heading,
}: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(index) ? [] : [index]));
    }
  };
  const containerClass =
    style === "bordered"
      ? "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
      : style === "separated"
      ? "space-y-3"
      : "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-700";
  const itemClass =
    style === "separated"
      ? "border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800"
      : "";
  return (
    <div className={containerClass}>
      {items.map((item, index) => (
        <div key={index} className={itemClass}>
          <AccordionItem
            title={item.title}
            content={item.content}
            isOpen={openIndexes.includes(index)}
            onToggle={() => toggleItem(index)}
          />
        </div>
      ))}
    </div>
  );
}

// Gallery Component
function GalleryComponent({
  images,
  columns,
  aspectRatio,
  enableLightbox,
}: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const gridCols: Record<"2" | "3" | "4", string> = {
    "2": "md:grid-cols-2",
    "3": "md:grid-cols-3",
    "4": "md:grid-cols-4",
  };
  const aspects: Record<"square" | "landscape" | "portrait", string> = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
  };
  return (
    <>
      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg ${aspects[aspectRatio]} group cursor-pointer`}
            onClick={() => enableLightbox && setLightboxIndex(index)}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-amber-400"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={images[lightboxIndex].src}
            alt={images[lightboxIndex].alt}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// Prayer Request Form
function PrayerRequestFormComponent({
  showNameField,
  showEmailField,
  showPhoneField,
  categories,
  submitButtonText,
  successMessage,
}: PrayerRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const categoryList = categories
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          {successMessage}
        </h3>
      </div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="space-y-4"
    >
      {showNameField && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Your Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            placeholder="Enter your name"
          />
        </div>
      )}
      {showEmailField && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            placeholder="your@email.com"
          />
        </div>
      )}
      {showPhoneField && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      )}
      {categoryList.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Prayer Category
          </label>
          <select className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <option value="">Select a category...</option>
            {categoryList.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Prayer Request *
        </label>
        <textarea
          required
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          placeholder="Share your prayer request here..."
        />
      </div>
      <button
        type="submit"
        className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Send className="w-5 h-5" />
        {submitButtonText}
      </button>
    </form>
  );
}

// Puck Configuration
export const puckConfig: Config = {
  categories: {
    layout: { title: "Layout", components: ["Hero", "Spacer", "Divider", "ButtonGroup"] },
    content: { title: "Content", components: ["Heading", "TextBlock", "Image", "Video", "Gallery"] },
    sections: { title: "Sections", components: ["Cards", "CTABanner", "Testimonials", "Stats", "IconGrid"] },
    interactive: { title: "Interactive", components: ["Accordion", "FAQ", "Timeline", "PhotoSlider", "CountdownTimer", "SocialLinks", "AnnouncementBanner"] },
    dynamic: { title: "Dynamic", components: ["EventsList", "ContactInfo", "MapEmbed"] },
    church: { title: "Church", components: ["ScriptureBlock", "SermonEmbed", "PrayerRequestForm", "ServiceTimes", "DonationCTA"] },
  },
  components: {
    Hero: {
      label: "Hero Section",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "text", label: "Subtitle" },
        backgroundImage: { type: "text", label: "Background Image URL" },
        overlayOpacity: { type: "number", label: "Overlay Opacity (%)", min: 0, max: 100 },
        alignment: {
          type: "radio",
          label: "Text Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
        showCTA: { type: "radio", label: "Show Buttons", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        ctaText: { type: "text", label: "Primary Button Text" },
        ctaLink: { type: "text", label: "Primary Button Link" },
        ctaSecondaryText: { type: "text", label: "Secondary Button Text" },
        ctaSecondaryLink: { type: "text", label: "Secondary Button Link" },
      },
      defaultProps: {
        title: "Welcome to PMCC 4th Watch",
        subtitle: "Holiness & Service Unto The Lord",
        backgroundImage: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80",
        overlayOpacity: 60,
        alignment: "center",
        showCTA: true,
        ctaText: "Locate Churches",
        ctaLink: "/locate",
        ctaSecondaryText: "I'm New Here",
        ctaSecondaryLink: "/new-here",
      },
      render: ({
        title,
        subtitle,
        backgroundImage,
        overlayOpacity,
        alignment,
        showCTA,
        ctaText,
        ctaLink,
        ctaSecondaryText,
        ctaSecondaryLink,
      }) => (
        <section
          className="relative min-h-[600px] flex items-center justify-center"
          style={{
            backgroundImage: backgroundImage
              ? `url(${backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="absolute inset-0 bg-slate-900"
            style={{ opacity: overlayOpacity / 100 }}
          />
          <div
            className={`relative z-10 container mx-auto px-4 text-${alignment}`}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl md:text-2xl text-white/80 mb-8">
                {subtitle}
              </p>
            )}
            {showCTA && (
              <div
                className={`flex gap-4 ${
                  alignment === "center"
                    ? "justify-center"
                    : alignment === "right"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {ctaText && ctaLink && (
                  <a
                    href={ctaLink}
                    className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-full transition-colors"
                  >
                    {ctaText}
                  </a>
                )}
                {ctaSecondaryText && ctaSecondaryLink && (
                  <a
                    href={ctaSecondaryLink}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold rounded-full transition-colors"
                  >
                    {ctaSecondaryText}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      ),
    },
    Heading: {
      label: "Heading",
      fields: {
        text: { type: "text", label: "Text" },
        level: {
          type: "select",
          label: "Level",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
            { label: "H4", value: "h4" },
          ],
        },
        alignment: {
          type: "radio",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: { text: "Section Heading", level: "h2", alignment: "center" },
      render: ({ text, level, alignment }) => {
        const Tag = level as keyof JSX.IntrinsicElements;
        const sizes: Record<HeadingLevel, string> = {
          h1: "text-4xl md:text-5xl",
          h2: "text-3xl md:text-4xl",
          h3: "text-2xl md:text-3xl",
          h4: "text-xl md:text-2xl",
        };
        return (
          <Tag
            className={`font-serif font-bold text-slate-900 dark:text-white ${
              sizes[level as HeadingLevel]
            } text-${alignment} py-4`}
          >
            {text}
          </Tag>
        );
      },
    },
    TextBlock: {
      label: "Text Block",
      fields: {
        content: { type: "textarea", label: "Content" },
        alignment: {
          type: "radio",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
        size: {
          type: "select",
          label: "Text Size",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ],
        },
      },
      defaultProps: {
        content: "Enter your text content here...",
        alignment: "left",
        size: "medium",
      },
      render: ({ content, alignment, size }) => {
        const sizes: Record<TextSize, string> = {
          small: "text-sm",
          medium: "text-base",
          large: "text-lg",
        };
        return (
          <div
            className={`prose dark:prose-invert max-w-none ${
              sizes[size as TextSize]
            } text-${alignment} py-4`}
          >
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
        );
      },
    },
    Image: {
      label: "Image",
      fields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text" },
        caption: { type: "text", label: "Caption" },
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
            { label: "Full Width", value: "full" },
          ],
        },
      },
      defaultProps: {
        src: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80",
        alt: "Image",
        caption: "",
        size: "medium",
      },
      render: ({ src, alt, caption, size }) => {
        const sizes: Record<ImageSize, string> = {
          small: "max-w-sm",
          medium: "max-w-2xl",
          large: "max-w-4xl",
          full: "w-full",
        };
        return (
          <figure className={`${sizes[size as ImageSize]} mx-auto py-4`}>
            <img src={src} alt={alt} className="w-full rounded-lg shadow-lg" />
            {caption && (
              <figcaption className="text-center text-sm text-slate-500 mt-2">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      },
    },
    Gallery: {
      label: "Image Gallery",
      fields: {
        heading: { type: "text", label: "Section Heading" },
        images: {
          type: "array",
          label: "Images",
          arrayFields: {
            src: { type: "text", label: "Image URL" },
            alt: { type: "text", label: "Alt Text" },
            caption: { type: "text", label: "Caption" },
          },
        },
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "2 Columns", value: "2" },
            { label: "3 Columns", value: "3" },
            { label: "4 Columns", value: "4" },
          ],
        },
        aspectRatio: {
          type: "select",
          label: "Aspect Ratio",
          options: [
            { label: "Square", value: "square" },
            { label: "Landscape", value: "landscape" },
            { label: "Portrait", value: "portrait" },
          ],
        },
        enableLightbox: {
          type: "radio",
          label: "Enable Lightbox",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
        },
      },
      defaultProps: {
        heading: "Photo Gallery",
        images: [
          {
            src: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&q=80",
            alt: "Church gathering",
            caption: "Sunday worship",
          },
          {
            src: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&q=80",
            alt: "Bible study",
            caption: "Bible study session",
          },
        ],
        columns: "3",
        aspectRatio: "square",
        enableLightbox: true,
      },
      render: (props) => (
        <section className="py-12">
          <div className="container mx-auto px-4">
            {props.heading && (
              <h2 className="text-3xl font-serif font-bold text-center text-slate-900 dark:text-white mb-8">
                {props.heading}
              </h2>
            )}
            <GalleryComponent
              heading={props.heading}
              images={props.images || []}
              columns={(props.columns || "3") as "2" | "3" | "4"}
              aspectRatio={
                (props.aspectRatio || "square") as
                  | "square"
                  | "landscape"
                  | "portrait"
              }
              enableLightbox={props.enableLightbox ?? true}
            />
          </div>
        </section>
      ),
    },
    Accordion: {
      label: "Accordion",
      fields: {
        heading: { type: "text", label: "Section Heading" },
        items: {
          type: "array",
          label: "Accordion Items",
          arrayFields: {
            title: { type: "text", label: "Title" },
            content: { type: "textarea", label: "Content" },
          },
        },
        allowMultiple: {
          type: "radio",
          label: "Allow Multiple Open",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
        },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Default", value: "default" },
            { label: "Bordered", value: "bordered" },
            { label: "Separated", value: "separated" },
          ],
        },
      },
      defaultProps: {
        heading: "Frequently Asked Questions",
        items: [
          {
            title: "What are your service times?",
            content: "We hold services every Sunday at 9:00 AM and 11:00 AM.",
          },
          {
            title: "How can I get involved?",
            content: "Visit our ministries page or speak with one of our pastors.",
          },
        ],
        allowMultiple: false,
        style: "default",
      },
      render: (props) => (
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            {props.heading && (
              <h2 className="text-3xl font-serif font-bold text-center text-slate-900 dark:text-white mb-8">
                {props.heading}
              </h2>
            )}
            <AccordionComponent
              heading={props.heading}
              items={props.items || []}
              allowMultiple={props.allowMultiple ?? false}
              style={(props.style || "default") as
                | "default"
                | "bordered"
                | "separated"}
            />
          </div>
        </section>
      ),
    },
    Spacer: {
      label: "Spacer",
      fields: {
        height: {
          type: "select",
          label: "Height",
          options: [
            { label: "Small (32px)", value: "small" },
            { label: "Medium (64px)", value: "medium" },
            { label: "Large (128px)", value: "large" },
            { label: "Extra Large (256px)", value: "xlarge" },
          ],
        },
      },
      defaultProps: { height: "medium" },
      render: ({ height }) => {
        const heights: Record<SpacerHeight, string> = {
          small: "h-8",
          medium: "h-16",
          large: "h-32",
          xlarge: "h-64",
        };
        return <div className={heights[height as SpacerHeight]} />;
      },
    },
    Divider: {
      label: "Divider",
      fields: {
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Dashed", value: "dashed" },
            { label: "Dotted", value: "dotted" },
          ],
        },
        color: { type: "text", label: "Color (CSS)" },
      },
      defaultProps: { style: "solid", color: "#e5e7eb" },
      render: ({ style, color }) => (
        <hr
          className="my-8 border-0 h-px"
          style={{
            backgroundImage:
              style === "dashed"
                ? `repeating-linear-gradient(90deg, ${color}, ${color} 8px, transparent 8px, transparent 16px)`
                : style === "dotted"
                ? `repeating-linear-gradient(90deg, ${color}, ${color} 4px, transparent 4px, transparent 12px)`
                : undefined,
            backgroundColor: style === "solid" ? color : undefined,
          }}
        />
      ),
    },
    Cards: {
      label: "Cards Grid",
      fields: {
        heading: { type: "text", label: "Section Heading" },
        cards: {
          type: "array",
          label: "Cards",
          arrayFields: {
            title: { type: "text", label: "Title" },
            description: { type: "textarea", label: "Description" },
            icon: { type: "text", label: "Icon" },
            link: { type: "text", label: "Link URL" },
          },
        },
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "2 Columns", value: "2" },
            { label: "3 Columns", value: "3" },
            { label: "4 Columns", value: "4" },
          ],
        },
      },
      defaultProps: {
        heading: "Our Ministries",
        cards: [
          {
            title: "Worship",
            description: "Join us for Spirit-filled worship services",
            icon: "heart",
            link: "/ministries",
          },
        ],
        columns: "3",
      },
      render: ({ heading, cards, columns }) => {
        const gridCols: Record<ColumnCount, string> = {
          "2": "md:grid-cols-2",
          "3": "md:grid-cols-3",
          "4": "md:grid-cols-4",
        };
        return (
          <section className="py-12">
            {heading && (
              <h2 className="text-3xl font-serif font-bold text-center text-slate-900 dark:text-white mb-8">
                {heading}
              </h2>
            )}
            <div className={`grid grid-cols-1 ${gridCols[columns as ColumnCount]} gap-6`}>
              {(cards as CardItem[]).map((card: CardItem, index: number) => (
                <div
                  key={index}
                  className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {card.description}
                  </p>
                  {card.link && (
                    <a
                      href={card.link}
                      className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Learn more <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      },
    },
    CTABanner: {
      label: "Call to Action Banner",
      fields: {
        heading: { type: "text", label: "Heading" },
        description: { type: "textarea", label: "Description" },
        buttonText: { type: "text", label: "Button Text" },
        buttonLink: { type: "text", label: "Button Link" },
        backgroundColor: { type: "text", label: "Background Color (CSS)" },
      },
      defaultProps: {
        heading: "Join Us This Sunday",
        description: "Experience the love of God and fellowship with our church family",
        buttonText: "Find a Church",
        buttonLink: "/locate",
        backgroundColor: "#1e3a5f",
      },
      render: ({ heading, description, buttonText, buttonLink, backgroundColor }) => (
        <section className="py-16 px-4" style={{ backgroundColor }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              {heading}
            </h2>
            {description && (
              <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                {description}
              </p>
            )}
            <a
              href={buttonLink}
              className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-full transition-colors"
            >
              {buttonText}
            </a>
          </div>
        </section>
      ),
    },
    Testimonials: {
      label: "Testimonials",
      fields: {
        heading: { type: "text", label: "Section Heading" },
        testimonials: {
          type: "array",
          label: "Testimonials",
          arrayFields: {
            quote: { type: "textarea", label: "Quote" },
            author: { type: "text", label: "Author Name" },
            role: { type: "text", label: "Role/Title" },
            image: { type: "text", label: "Author Image URL" },
          },
        },
      },
      defaultProps: {
        heading: "What People Say",
        testimonials: [
          {
            quote: "This church has transformed my life.",
            author: "Maria Santos",
            role: "Church Member",
            image: "",
          },
        ],
      },
      render: ({ heading, testimonials }) => (
        <section className="py-12 bg-slate-50 dark:bg-slate-800/50">
          <div className="container mx-auto px-4">
            {heading && (
              <h2 className="text-3xl font-serif font-bold text-center text-slate-900 dark:text-white mb-8">
                {heading}
              </h2>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(testimonials as TestimonialItem[]).map(
                (testimonial: TestimonialItem, index: number) => (
                  <div
                    key={index}
                    className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm"
                  >
                    <Quote className="w-8 h-8 text-amber-500 mb-4" />
                    <p className="text-slate-600 dark:text-slate-300 mb-6 italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      {testimonial.image ? (
                        <img
                          src={testimonial.image}
                          alt={testimonial.author}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                          <span className="text-amber-600 font-bold">
                            {testimonial.author[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {testimonial.author}
                        </p>
                        {testimonial.role && (
                          <p className="text-sm text-slate-500">
                            {testimonial.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      ),
    },
    Stats: {
      label: "Statistics",
      fields: {
        stats: {
          type: "array",
          label: "Stats",
          arrayFields: {
            value: { type: "text", label: "Value" },
            label: { type: "text", label: "Label" },
          },
        },
        backgroundColor: { type: "text", label: "Background Color" },
      },
      defaultProps: {
        stats: [
          { value: "50+", label: "Churches" },
          { value: "10,000+", label: "Members" },
        ],
        backgroundColor: "#1e3a5f",
      },
      render: ({ stats, backgroundColor }) => (
        <section className="py-16" style={{ backgroundColor }}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {(stats as StatItem[]).map((stat: StatItem, index: number) => (
                <div key={index} className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-amber-400 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-white/80 text-sm uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ),
    },
  },
};

export default puckConfig;
