// ============================================================
// VINE REVIEW GENERATOR
// Generates short, honest, first-person review text appropriate
// for Amazon Vine reviews. NOT polished/professional — Vine
// reviews should sound like a real person who received the item
// free and is sharing their genuine experience.
//
// Uses category-aware templates with randomisation so every
// generated review sounds different.
// ============================================================

import type { VineItem } from "@/lib/businessTypes";

export interface GeneratedVineReview {
  title: string;
  body: string;
  suggestedRating: number;
}

// ─── CATEGORY DETECTION ─────────────────────────────────────

type VineCategory =
  | "electronics"
  | "kitchen"
  | "beauty"
  | "pet"
  | "toys"
  | "clothing"
  | "sports"
  | "baby"
  | "books"
  | "home"
  | "generic";

const CATEGORY_KEYWORDS: Record<VineCategory, string[]> = {
  electronics: ["tech", "electronic", "gadget", "device", "phone", "computer", "camera", "battery", "charger", "headphone", "speaker", "keyboard", "mouse", "cable", "hub", "ssd", "drive", "wireless", "bluetooth", "earbuds", "monitor", "tablet"],
  kitchen: ["kitchen", "cook", "food", "pan", "pot", "knife", "appliance", "coffee", "blender", "utensil", "cutlery", "storage", "container", "cup", "mug", "bottle", "grater", "strainer"],
  beauty: ["beauty", "skin", "hair", "makeup", "lotion", "cream", "serum", "shampoo", "conditioner", "nail", "brush", "cosmetic", "moisturizer", "cleanser", "lip", "face"],
  pet: ["pet", "dog", "cat", "animal", "collar", "leash", "toy", "treat", "grooming", "bowl", "bed", "cage"],
  toys: ["toy", "game", "puzzle", "lego", "doll", "action figure", "playset", "board game", "card game"],
  clothing: ["shirt", "pants", "dress", "shoes", "sock", "hat", "jacket", "coat", "underwear", "apparel", "clothing", "wear", "gloves", "scarf"],
  sports: ["sport", "fitness", "yoga", "gym", "workout", "exercise", "bike", "running", "weight", "resistance", "band", "hiking", "outdoor"],
  baby: ["baby", "infant", "toddler", "diaper", "stroller", "nursery", "pacifier", "feeding"],
  books: ["book", "novel", "guide", "manual", "journal", "planner", "notebook"],
  home: ["home", "decor", "furniture", "lamp", "rug", "pillow", "blanket", "curtain", "organizer", "shelf", "hook", "cleaning", "garden"],
  generic: [],
};

function detectCategory(item: VineItem): VineCategory {
  const text = `${item.product_name} ${item.category}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [VineCategory, string[]][]) {
    if (cat === "generic") continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return cat;
    }
  }
  return "generic";
}

// ─── PICK RANDOM ────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a realistic star rating weighted toward positive reviews
 * (Vine reviewers skew positive since they received the item free).
 * Distribution: 5★ 35% · 4★ 45% · 3★ 20%
 *
 * Thresholds: r < 0.35 → 5★ | r < 0.80 → 4★ | else → 3★
 */
function pickRating(): number {
  const FIVE_STAR_THRESHOLD = 0.35;  // 35% chance of 5 stars
  const FOUR_STAR_THRESHOLD = 0.80;  // next 45% → 4 stars (0.35–0.80)
  const r = Math.random();
  if (r < FIVE_STAR_THRESHOLD) return 5;
  if (r < FOUR_STAR_THRESHOLD) return 4;
  return 3;
}

// ─── TEMPLATES BY CATEGORY ──────────────────────────────────

interface CategoryTemplates {
  titles: string[];
  openings: string[];
  middles: string[];
  closings: string[];
  rating: number;
}

function getTemplates(name: string, cat: VineCategory): CategoryTemplates {
  const templates: Record<VineCategory, CategoryTemplates> = {
    electronics: {
      titles: [
        `${name} — quick honest take`,
        `Does the ${name} actually work?`,
        `${name}: worth getting?`,
        `My experience with the ${name}`,
        `${name} — a few weeks in`,
      ],
      openings: [
        `Got the ${name} through Vine a while back and finally have enough time with it to write this up.`,
        `Been using the ${name} for a few weeks now so I have a decent sense of it.`,
        `The ${name} arrived well-packaged and I've been putting it through its paces since.`,
      ],
      middles: [
        `Setup was straightforward — plugged in and it worked. No complicated steps. The build quality is solid, nothing feels cheap or fragile. Day-to-day performance has been consistent.`,
        `Getting it set up took about five minutes. Build quality is good for the price range. Haven't had any issues so far, it just works the way you'd expect.`,
        `Out of the box everything was included that you need. Build feels durable. Performance matches what's advertised — it does exactly what it says on the box.`,
      ],
      closings: [
        `Overall pretty happy with it. Good value.`,
        `No complaints. Does what it says.`,
        `Would recommend for anyone looking for a reliable option in this category.`,
      ],
      rating: 4,
    },
    kitchen: {
      titles: [
        `${name} — does it hold up?`,
        `Used the ${name} for a month, here's my take`,
        `${name}: practical everyday review`,
        `My honest take on the ${name}`,
        `${name} — kitchen test`,
      ],
      openings: [
        `Been using the ${name} in my kitchen for a few weeks and wanted to share what I think.`,
        `The ${name} came in good condition and I've used it pretty much daily.`,
        `Got the ${name} through Vine and it's been getting regular use in the kitchen.`,
      ],
      middles: [
        `Quality is solid — feels like it'll hold up to daily use. Easy to clean, which matters a lot to me. Does what it's supposed to do without any fuss.`,
        `Good materials, nothing flimsy. Cleanup is simple. The design is practical and works well for what I use it for.`,
        `Sturdy construction. Washes up easily. No complaints about the quality — it's a well-made product that does its job.`,
      ],
      closings: [
        `Happy with this purchase. Would add it to my kitchen again.`,
        `Good product. Definitely useful to have.`,
        `Solid addition to the kitchen. Recommended.`,
      ],
      rating: 4,
    },
    beauty: {
      titles: [
        `${name} — my experience`,
        `Tried the ${name} for a few weeks`,
        `${name}: real results?`,
        `My honest ${name} review`,
        `${name} — worth it?`,
      ],
      openings: [
        `I've been testing the ${name} for several weeks now and wanted to give an honest review.`,
        `Got the ${name} through Vine and have been incorporating it into my routine.`,
        `Been using the ${name} consistently and have a good feel for it now.`,
      ],
      middles: [
        `The texture is nice, absorbs well, and doesn't leave a weird residue. Scent is mild — not overpowering. My skin/hair has been responding well to it.`,
        `Nice formulation, goes on smoothly. Doesn't irritate. I've seen some positive difference in how my skin/hair looks and feels.`,
        `Good consistency, easy to apply. No irritation or adverse reactions. Works as described.`,
      ],
      closings: [
        `Would continue using it. Decent product.`,
        `Good addition to my routine. Satisfied.`,
        `Works well for its intended purpose. Recommended.`,
      ],
      rating: 4,
    },
    pet: {
      titles: [
        `${name} — my pet approves`,
        `${name}: pet tested`,
        `My dog/cat's take on the ${name}`,
        `${name} review — real pet household`,
      ],
      openings: [
        `Got the ${name} for my pet and wanted to share how it's been going.`,
        `My pet has been using the ${name} since it arrived and I have some thoughts.`,
        `Brought this home for my pet — here's the honest update.`,
      ],
      middles: [
        `Quality seems good — durable materials, nothing my pet can easily destroy. It's held up well. My pet took to it pretty quickly.`,
        `Solid build, nothing cheap about it. My pet actually uses it, which is the real test. Easy to clean.`,
        `Good construction. My pet has been using it regularly without issue. Easy to wipe down.`,
      ],
      closings: [
        `Pet approved. Happy with this.`,
        `Good product. My pet seems to like it.`,
        `Recommended for pet owners.`,
      ],
      rating: 4,
    },
    toys: {
      titles: [
        `${name} — kid-tested`,
        `${name}: honest parent review`,
        `My kid's take on the ${name}`,
        `${name} review — real household use`,
      ],
      openings: [
        `Got the ${name} for my kid and wanted to share how it's been.`,
        `My kid has been playing with the ${name} since it arrived.`,
        `Brought this home and it's been getting regular use.`,
      ],
      middles: [
        `Quality seems good — sturdy enough to handle kids being kids. Instructions were easy. My kid engaged with it right away which is always the real test.`,
        `Solid build, good materials. My kid enjoys it and it's held up well to daily play.`,
        `Well-made toy. Age-appropriate. My kid plays with it regularly which says everything.`,
      ],
      closings: [
        `Kid approved. Happy with this.`,
        `Good product. Recommended for the age group.`,
        `Does what it's supposed to. Fun product.`,
      ],
      rating: 4,
    },
    clothing: {
      titles: [
        `${name} — fit and quality check`,
        `${name}: honest sizing review`,
        `My take on the ${name}`,
        `${name} — worn and tested`,
      ],
      openings: [
        `Got the ${name} through Vine and have been wearing it for a bit now.`,
        `The ${name} arrived and I've worn it a few times to get a proper feel.`,
        `Been wearing the ${name} and wanted to share my honest thoughts.`,
      ],
      middles: [
        `Sizing runs true. Fabric quality is better than I expected. Comfortable to wear. The construction seems solid — no loose threads or weird seams.`,
        `Fits well. Good fabric. Comfortable for daily wear. Quality is decent for the price range.`,
        `True to size. Nice material, comfortable to wear. Well-stitched. No complaints about the quality.`,
      ],
      closings: [
        `Happy with this. Good value.`,
        `Would wear it again. Solid item.`,
        `Good quality clothing item. Recommended.`,
      ],
      rating: 4,
    },
    sports: {
      titles: [
        `${name} — workout tested`,
        `${name}: real use review`,
        `My honest take on the ${name}`,
        `${name} — actually works?`,
      ],
      openings: [
        `Got the ${name} through Vine and have been using it in my workouts.`,
        `The ${name} has been part of my routine for a few weeks now.`,
        `Been putting the ${name} to work and have a good sense of it.`,
      ],
      middles: [
        `Good quality. Holds up to regular use. Does what it's designed to do. Comfortable and easy to use during workouts.`,
        `Solid build. Works well. No issues during use. Does exactly what you need it to for working out.`,
        `Durable construction. Comfortable during activity. Performs as advertised.`,
      ],
      closings: [
        `Good fitness product. Recommended.`,
        `Happy with this. Does the job well.`,
        `Would add this to my routine again.`,
      ],
      rating: 4,
    },
    baby: {
      titles: [
        `${name} — parent approved`,
        `${name}: tested with real baby`,
        `My take on the ${name} as a parent`,
        `${name} — honest parent review`,
      ],
      openings: [
        `Got the ${name} for my little one and have been using it since.`,
        `The ${name} arrived and we've been using it in our routine.`,
        `Tested the ${name} with my baby and wanted to share what I found.`,
      ],
      middles: [
        `Quality is good. Safe materials. Easy to clean which is huge with babies. Baby took to it fine.`,
        `Solid construction. No sharp edges or concerning materials. Easy to clean. Baby-friendly design.`,
        `Good build quality. Safe and durable. Cleaned up easily. Works as expected for a baby product.`,
      ],
      closings: [
        `Good baby product. Recommended.`,
        `Parent approved. Would use again.`,
        `Does what it's supposed to. Happy with this.`,
      ],
      rating: 4,
    },
    books: {
      titles: [
        `${name} — actually read it`,
        `${name}: worth your time?`,
        `My honest take on ${name}`,
        `Finished ${name} — here's my review`,
      ],
      openings: [
        `Got the ${name} through Vine and actually sat down and read it.`,
        `Read through the ${name} and wanted to give an honest review.`,
        `Finished ${name} and have some thoughts to share.`,
      ],
      middles: [
        `Good content. Well-organized and easy to follow. Information is useful and well-presented. I got value out of reading it.`,
        `Solid read. Content is relevant and useful. Well-written and easy to get through.`,
        `Good book. Informative and well-structured. Worth the time to read.`,
      ],
      closings: [
        `Good read. Recommended.`,
        `Worth reading. Would recommend to others.`,
        `Solid book. Happy I read it.`,
      ],
      rating: 4,
    },
    home: {
      titles: [
        `${name} — does it work at home?`,
        `${name}: honest home review`,
        `My take on the ${name} after using it`,
        `${name} — home tested`,
      ],
      openings: [
        `Got the ${name} through Vine and it's been in use around the house.`,
        `The ${name} has been deployed in my home and here's the honest take.`,
        `Been using the ${name} at home for a few weeks now.`,
      ],
      middles: [
        `Good quality. Sturdy. Does what it's designed to do. Easy to use and setup was simple.`,
        `Solid build. Works as advertised. Easy to put together/use. Good quality for the category.`,
        `Well-made. Functions as expected. Easy to use. No issues so far.`,
      ],
      closings: [
        `Good home product. Would buy again.`,
        `Happy with this. Does the job.`,
        `Recommended. Good value.`,
      ],
      rating: 4,
    },
    generic: {
      titles: [
        `${name} — my honest review`,
        `${name}: worth it?`,
        `Quick take on the ${name}`,
        `My experience with ${name}`,
        `${name} review after a few weeks`,
      ],
      openings: [
        `Got the ${name} through Vine and have been using it for a few weeks.`,
        `The ${name} arrived in good condition and I've had time to properly test it out.`,
        `Been using the ${name} since it arrived through Vine — here's what I think.`,
      ],
      middles: [
        `Quality is solid. Does what it's supposed to. Nothing fancy, just works. Easy to use right out of the box.`,
        `Good build quality for the price range. Performs as described. Setup was easy. No complaints.`,
        `Well-made. Functions as advertised. Easy to use. I've had zero issues with it.`,
      ],
      closings: [
        `Overall happy with this. Decent product.`,
        `No complaints. Does what it says. Would recommend.`,
        `Good value. Would use again.`,
      ],
      rating: 4,
    },
  };

  return templates[cat] ?? templates.generic;
}

// ─── MAIN GENERATOR ─────────────────────────────────────────

/**
 * Generate a short, honest Vine review for a product.
 * The output is NOT polished — it should sound like a real
 * person who received the item free and is sharing their
 * genuine first impressions.
 *
 * Call this AFTER the item has been received.
 */
export function generateVineReview(item: VineItem): GeneratedVineReview {
  const cat = detectCategory(item);
  const tpl = getTemplates(item.product_name, cat);

  const title = pick(tpl.titles);
  const opening = pick(tpl.openings);
  const middle = pick(tpl.middles);
  const closing = pick(tpl.closings);
  const body = [opening, middle, closing].join(" ");

  return {
    title,
    body,
    suggestedRating: pickRating(),
  };
}

/**
 * Generates review text and formats it ready to copy into Vine.
 * Returns title and body separately since Vine has two fields.
 */
export function generateVineReviewForCopy(item: VineItem): {
  title: string;
  body: string;
  rating: number;
} {
  const { title, body, suggestedRating } = generateVineReview(item);
  return { title, body, rating: suggestedRating };
}
