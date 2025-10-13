// Simple analytics tracking utility

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class Analytics {
  private enabled = true;

  track(event: AnalyticsEvent) {
    if (!this.enabled) return;

    console.log("[Analytics]", event.name, event.properties);

    // Store event in localStorage for basic tracking
    try {
      const events = JSON.parse(localStorage.getItem("analytics_events") || "[]");
      events.push({
        ...event,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }

      localStorage.setItem("analytics_events", JSON.stringify(events));
    } catch (error) {
      console.error("Analytics storage error:", error);
    }
  }

  pageView(path: string) {
    this.track({
      name: "page_view",
      properties: { path },
    });
  }

  productAccess(productSlug: string) {
    this.track({
      name: "product_access",
      properties: { productSlug },
    });
  }

  postCreated() {
    this.track({ name: "post_created" });
  }

  postLiked(postId: string) {
    this.track({
      name: "post_liked",
      properties: { postId },
    });
  }

  ticketCreated(ticketId: string) {
    this.track({
      name: "ticket_created",
      properties: { ticketId },
    });
  }

  getEvents() {
    try {
      return JSON.parse(localStorage.getItem("analytics_events") || "[]");
    } catch {
      return [];
    }
  }
}

export const analytics = new Analytics();
