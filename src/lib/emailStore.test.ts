import { describe, it, expect, beforeEach } from "vitest";
import {
  getSubscribers,
  saveSubscribers,
  addSubscriber,
  confirmSubscriber,
  unsubscribeSubscriber,
  getSubscriberByEmail,
  updateSubscriber,
  getSegments,
  createSegment,
  getSegmentSubscribers,
  getNewsletters,
  saveNewsletter,
  deleteNewsletter,
  getConfirmationEmails,
  getSubscriberAnalytics,
} from "./emailStore";
import type { Newsletter } from "./emailTypes";

describe("emailStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getSubscribers ────────────────────────────────────────

  describe("getSubscribers", () => {
    it("returns empty array when nothing is stored", () => {
      expect(getSubscribers()).toEqual([]);
    });

    it("returns stored subscribers", () => {
      const sub = {
        id: "sub-1",
        email: "a@b.com",
        source_page: "home",
        status: "pending" as const,
        created_at: new Date().toISOString(),
        email_count: 0,
        open_count: 0,
        click_count: 0,
        tags: [],
      };
      saveSubscribers([sub]);
      expect(getSubscribers()).toHaveLength(1);
      expect(getSubscribers()[0].email).toBe("a@b.com");
    });

    it("returns empty array on corrupted JSON (json parse resilience)", () => {
      localStorage.setItem("reese-email-subscribers", "NOT_VALID_JSON{{{");
      expect(getSubscribers()).toEqual([]);
    });
  });

  // ── addSubscriber ─────────────────────────────────────────

  describe("addSubscriber", () => {
    it("adds a new subscriber and returns subscriber + confirmation email", () => {
      const result = addSubscriber("user@example.com", "Test User", ["Tech News"], "home");
      expect(result).not.toBeNull();
      expect(result!.subscriber.email).toBe("user@example.com");
      expect(result!.subscriber.status).toBe("pending");
      expect(result!.confirmationEmail.email).toBe("user@example.com");
    });

    it("sanitizes the email before saving (lowercases)", () => {
      const result = addSubscriber("USER@EXAMPLE.COM", undefined, [], "home");
      expect(result).not.toBeNull();
      expect(result!.subscriber.email).toBe("user@example.com");
    });

    it("returns null for an invalid email", () => {
      expect(addSubscriber("not-an-email", undefined, [], "home")).toBeNull();
    });

    it("returns null for a duplicate email", () => {
      addSubscriber("dup@example.com", undefined, [], "home");
      const second = addSubscriber("dup@example.com", undefined, [], "home");
      expect(second).toBeNull();
    });

    it("persists the subscriber to localStorage", () => {
      addSubscriber("persist@example.com", "Jane", [], "home");
      const stored = getSubscribers();
      expect(stored.some((s) => s.email === "persist@example.com")).toBe(true);
    });

    it("stores a confirmation email in localStorage", () => {
      addSubscriber("conf@example.com", undefined, [], "home");
      const confirmations = getConfirmationEmails();
      expect(confirmations.some((c) => c.email === "conf@example.com")).toBe(true);
    });
  });

  // ── confirmSubscriber ─────────────────────────────────────

  describe("confirmSubscriber", () => {
    it("confirms a subscriber with a valid token", () => {
      const result = addSubscriber("confirm@example.com", undefined, [], "home");
      const token = result!.subscriber.confirmation_token!;
      const confirmed = confirmSubscriber(token);
      expect(confirmed).not.toBeNull();
      expect(confirmed!.status).toBe("confirmed");
    });

    it("returns null for an unknown token", () => {
      expect(confirmSubscriber("bogus-token-xyz")).toBeNull();
    });

    it("sets confirmed_at timestamp on the subscriber", () => {
      const result = addSubscriber("ts@example.com", undefined, [], "home");
      const token = result!.subscriber.confirmation_token!;
      const confirmed = confirmSubscriber(token);
      expect(confirmed!.confirmed_at).toBeTruthy();
    });
  });

  // ── unsubscribeSubscriber ─────────────────────────────────

  describe("unsubscribeSubscriber", () => {
    it("unsubscribes an existing subscriber", () => {
      addSubscriber("unsub@example.com", undefined, [], "home");
      expect(unsubscribeSubscriber("unsub@example.com")).toBe(true);
      const sub = getSubscriberByEmail("unsub@example.com");
      expect(sub?.status).toBe("unsubscribed");
    });

    it("returns false when email is not found", () => {
      expect(unsubscribeSubscriber("ghost@example.com")).toBe(false);
    });

    it("is case-insensitive for the email lookup", () => {
      addSubscriber("case@example.com", undefined, [], "home");
      expect(unsubscribeSubscriber("CASE@EXAMPLE.COM")).toBe(true);
    });
  });

  // ── getSubscriberByEmail ──────────────────────────────────

  describe("getSubscriberByEmail", () => {
    it("finds a subscriber by email", () => {
      addSubscriber("find@example.com", "Find Me", [], "home");
      const sub = getSubscriberByEmail("find@example.com");
      expect(sub).not.toBeNull();
      expect(sub?.name).toBe("Find Me");
    });

    it("returns null when email not found", () => {
      expect(getSubscriberByEmail("missing@example.com")).toBeNull();
    });
  });

  // ── updateSubscriber ──────────────────────────────────────

  describe("updateSubscriber", () => {
    it("updates subscriber fields", () => {
      const result = addSubscriber("update@example.com", "Old Name", [], "home");
      const id = result!.subscriber.id;
      updateSubscriber(id, { name: "New Name", email_count: 5 });
      const sub = getSubscriberByEmail("update@example.com");
      expect(sub?.name).toBe("New Name");
      expect(sub?.email_count).toBe(5);
    });

    it("does nothing for an unknown id", () => {
      updateSubscriber("non-existent-id", { name: "Ghost" });
      expect(getSubscribers()).toHaveLength(0);
    });
  });

  // ── Segments ──────────────────────────────────────────────

  describe("getSegments / createSegment", () => {
    it("returns empty array when no segments stored", () => {
      expect(getSegments()).toEqual([]);
    });

    it("creates a segment and persists it", () => {
      const seg = createSegment("Pending Users", "All pending subscribers", { status: ["pending"] });
      expect(seg.name).toBe("Pending Users");
      expect(getSegments()).toHaveLength(1);
    });

    it("counts matching subscribers in the segment", () => {
      addSubscriber("a@example.com", undefined, [], "home");
      addSubscriber("b@example.com", undefined, [], "home");
      const seg = createSegment("Pending", "desc", { status: ["pending"] });
      expect(seg.subscriber_count).toBe(2);
    });

    it("returns empty array on corrupted segments JSON", () => {
      localStorage.setItem("reese-email-segments", "{broken:");
      expect(getSegments()).toEqual([]);
    });
  });

  describe("getSegmentSubscribers", () => {
    it("returns subscribers matching segment filter", () => {
      addSubscriber("seg1@example.com", undefined, [], "home");
      addSubscriber("seg2@example.com", undefined, [], "blog");
      const seg = createSegment("Home signups", "desc", { source_pages: ["home"] });
      const members = getSegmentSubscribers(seg.id);
      expect(members).toHaveLength(1);
      expect(members[0].source_page).toBe("home");
    });

    it("returns empty array for unknown segment id", () => {
      expect(getSegmentSubscribers("non-existent")).toEqual([]);
    });
  });

  // ── Newsletters ───────────────────────────────────────────

  describe("getNewsletters / saveNewsletter / deleteNewsletter", () => {
    const mockNewsletter: Newsletter = {
      id: "nl-1",
      name: "Weekly Update",
      template: "weekly_update",
      subject_line: "This week in reviews",
      preheader: "Don't miss...",
      content_html: "<p>Hello</p>",
      content_text: "Hello",
      affiliate_links_used: [],
      segments: [],
      created_at: new Date().toISOString(),
      status: "draft",
      stats: {
        total_sent: 0,
        total_opened: 0,
        total_clicked: 0,
        total_unsubscribed: 0,
        open_rate: 0,
        click_rate: 0,
        unsubscribe_rate: 0,
      },
    };

    it("returns empty array when no newsletters stored", () => {
      expect(getNewsletters()).toEqual([]);
    });

    it("saves and retrieves a newsletter", () => {
      saveNewsletter(mockNewsletter);
      const list = getNewsletters();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe("Weekly Update");
    });

    it("updates an existing newsletter by id", () => {
      saveNewsletter(mockNewsletter);
      saveNewsletter({ ...mockNewsletter, name: "Updated Name" });
      expect(getNewsletters()).toHaveLength(1);
      expect(getNewsletters()[0].name).toBe("Updated Name");
    });

    it("deletes a newsletter by id", () => {
      saveNewsletter(mockNewsletter);
      deleteNewsletter("nl-1");
      expect(getNewsletters()).toHaveLength(0);
    });
  });

  // ── getSubscriberAnalytics ────────────────────────────────

  describe("getSubscriberAnalytics", () => {
    it("returns zero counts when no subscribers", () => {
      const analytics = getSubscriberAnalytics();
      expect(analytics.total_subscribers).toBe(0);
      expect(analytics.confirmed_subscribers).toBe(0);
    });

    it("counts confirmed vs pending correctly", () => {
      const result = addSubscriber("a@example.com", undefined, [], "home");
      addSubscriber("b@example.com", undefined, [], "home");
      confirmSubscriber(result!.subscriber.confirmation_token!);

      const analytics = getSubscriberAnalytics();
      expect(analytics.total_subscribers).toBe(2);
      expect(analytics.confirmed_subscribers).toBe(1);
      expect(analytics.pending_subscribers).toBe(1);
    });
  });
});
