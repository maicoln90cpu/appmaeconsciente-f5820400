// Analytics tracking utility with Plausible integration

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, any> }) => void;
  }
}

class Analytics {
  private enabled = true;
  private sessionId: string;
  private plausibleEnabled = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.checkPlausible();
  }

  private checkPlausible() {
    // Verificar if Plausible script is loaded
    if (typeof window !== 'undefined' && window.plausible) {
      this.plausibleEnabled = true;
      // Using console.info for analytics initialization message (allowed by ESLint config)
      console.info('[Analytics] Plausible detected');
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  track(event: AnalyticsEvent) {
    if (!this.enabled) return;

    // Using console.info for analytics tracking (allowed by ESLint config)
    console.info('[Analytics]', event.name, event.properties);

    // Enviar to Plausible if available
    if (this.plausibleEnabled && window.plausible) {
      try {
        window.plausible(event.name, {
          props: event.properties,
        });
      } catch (error) {
        console.error('Plausible tracking error:', error);
      }
    }

    // Store event in localStorage for backup tracking
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push({
        ...event,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
      });

      // Keep only last 200 events
      if (events.length > 200) {
        events.shift();
      }

      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Analytics storage error:', error);
    }
  }

  pageView(path: string) {
    this.track({
      name: 'page_view',
      properties: { path },
    });
  }

  productAccess(productSlug: string) {
    this.track({
      name: 'product_access',
      properties: { productSlug },
    });
  }

  postCreated() {
    this.track({ name: 'post_created' });
  }

  postLiked(postId: string) {
    this.track({
      name: 'post_liked',
      properties: { postId },
    });
  }

  ticketCreated(ticketId: string) {
    this.track({
      name: 'ticket_created',
      properties: { ticketId },
    });
  }

  itemAdded(category: string) {
    this.track({
      name: 'item_added',
      properties: { category },
    });
  }

  itemPurchased(category: string, price: number) {
    this.track({
      name: 'item_purchased',
      properties: { category, price },
    });
  }

  budgetExceeded(currentBudget: number, totalSpent: number) {
    this.track({
      name: 'budget_exceeded',
      properties: { currentBudget, totalSpent, overspent: totalSpent - currentBudget },
    });
  }

  enxovalShared() {
    this.track({ name: 'enxoval_shared' });
  }

  enxovalExported(format: 'pdf' | 'excel') {
    this.track({
      name: 'enxoval_exported',
      properties: { format },
    });
  }

  getEvents() {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch {
      return [];
    }
  }

  getEventsSummary() {
    const events = this.getEvents();
    const summary: Record<string, number> = {};

    events.forEach((event: any) => {
      summary[event.name] = (summary[event.name] || 0) + 1;
    });

    return summary;
  }

  clearEvents() {
    localStorage.removeItem('analytics_events');
    sessionStorage.removeItem('analytics_session_id');
    this.sessionId = this.getOrCreateSessionId();
  }
}

export const analytics = new Analytics();
