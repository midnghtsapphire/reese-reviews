/**
 * Site Content Store — manages all editable site content in localStorage.
 * Provides defaults and CRUD operations for the admin panel.
 */

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutStory: string;
  aboutValues: { title: string; description: string }[];
  footerBrand: string;
  footerDescription: string;
  footerDisclosure: string;
  categories: { value: string; label: string; icon: string; description: string }[];
}

const SITE_CONTENT_KEY = "reese-reviews-site-content";

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroTitle: "Reese Reviews",
  heroSubtitle: "From Box to Beautiful",
  heroTagline:
    "From Box to Beautiful. Unfiltered takes on buying, assembling, and everything in between.",
  aboutTitle: "Hey, I'm Reese",
  aboutSubtitle: "Meet the Reviewer",
  aboutStory: `Reese Reviews started from something really simple — I love trying new things and telling people about them. Whether it's a new pair of earbuds, a restaurant I stumbled into, or a streaming service I binged for a month, I always had opinions. My friends and family were always asking, "Reese, is this worth it?" So I figured, why not share it with everyone?

As someone who is legally deaf, I experience the world a little differently. That perspective shapes every review I write. I notice things others might miss — like whether a product has good visual feedback, whether a restaurant's menu is easy to read, or whether an app relies too heavily on audio cues. Accessibility isn't just a checkbox for me. It's personal.

That's also why this website has built-in accessibility modes. The Neurodivergent mode uses a high-legibility font and removes all animations. The ECO CODE mode strips everything down to save energy. And the No Blue Light mode shifts to warm tones for late-night reading. Because everyone deserves a comfortable experience.

Every review on this site is my genuine opinion. I don't accept payment for positive reviews. Some links are affiliate links (clearly marked), which help support the site — but they never influence my ratings or opinions. What you read is what I actually think. Period.`,
  aboutValues: [
    {
      title: "Honest Reviews",
      description:
        "Every review is 100% genuine. No paid opinions, no sugarcoating. If something's great, you'll know. If it's not, you'll know that too.",
    },
    {
      title: "Accessibility First",
      description:
        "As someone who is legally deaf, Reese knows firsthand that accessibility isn't a feature — it's a right. This site is built with that belief at its core.",
    },
    {
      title: "Visual Clarity",
      description:
        "Clean design, readable text, and thoughtful contrast. Every element is designed to be seen, understood, and enjoyed by everyone.",
    },
    {
      title: "Community Driven",
      description:
        "Reese Reviews isn't just one voice — it's a platform for everyone to share their honest experiences and help others make better choices.",
    },
  ],
  footerBrand: "Reese Reviews",
  footerDescription:
    "From Box to Beautiful. Honest, unfiltered reviews on everything — products, food, services, entertainment, and tech.",
  footerDisclosure:
    "Some links on this site are affiliate links. We may earn a small commission at no extra cost to you. All opinions are genuinely Reese's own.",
  categories: [
    { value: "products", label: "Products", icon: "📦", description: "Gadgets, home goods, beauty, and everything unboxed" },
    { value: "food-restaurants", label: "Food & Restaurants", icon: "🍽️", description: "Restaurant visits, food delivery, snacks, and recipes" },
    { value: "services", label: "Services", icon: "🛠️", description: "Subscriptions, apps, customer service, and more" },
    { value: "entertainment", label: "Entertainment", icon: "🎬", description: "Movies, shows, games, books, and live events" },
    { value: "tech", label: "Tech", icon: "💻", description: "Phones, laptops, software, and smart devices" },
  ],
};

export function getSiteContent(): SiteContent {
  try {
    const stored = localStorage.getItem(SITE_CONTENT_KEY);
    if (stored) {
      return { ...DEFAULT_SITE_CONTENT, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_SITE_CONTENT;
}

export function saveSiteContent(content: Partial<SiteContent>): SiteContent {
  const current = getSiteContent();
  const updated = { ...current, ...content };
  localStorage.setItem(SITE_CONTENT_KEY, JSON.stringify(updated));
  // Dispatch a custom event so other components can react
  window.dispatchEvent(new CustomEvent("site-content-updated"));
  return updated;
}

export function resetSiteContent(): SiteContent {
  localStorage.removeItem(SITE_CONTENT_KEY);
  window.dispatchEvent(new CustomEvent("site-content-updated"));
  return DEFAULT_SITE_CONTENT;
}
