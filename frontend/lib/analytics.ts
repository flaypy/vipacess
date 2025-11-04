// Dynamic import to avoid SSR issues
let plausibleTracker: any = null;
let isInitialized = false;

// Initialize Plausible tracker
export async function initPlausible() {
  if (typeof window === 'undefined' || isInitialized) return;

  try {
    // Dynamic import to avoid SSR issues with location
    const { init } = await import('@plausible-analytics/tracker');

    plausibleTracker = init({
      // Domain is automatically detected from window.location.hostname
      domain: window.location.hostname,
      endpoint: process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST
        ? `${process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST}/api/event`
        : 'https://plausible.io/api/event',
      captureOnLocalhost: process.env.NODE_ENV === 'development',
      autoCapturePageviews: true,
    });

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Plausible:', error);
  }
}

// Track custom events
export async function trackEvent(eventName: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    await initPlausible();
  }

  try {
    const { track } = await import('@plausible-analytics/tracker');
    track(eventName, {
      props: props as Record<string, string>
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Track specific business events
export const analytics = {
  // E-commerce events
  viewProduct: (productId: string, productName: string) => {
    trackEvent('Product Viewed', { productId, productName });
  },

  addToCart: (productId: string, productName: string, price: number) => {
    trackEvent('Add to Cart', { productId, productName, price });
  },

  initiateCheckout: (productId: string, priceId: string, amount: number) => {
    trackEvent('Checkout Started', { productId, priceId, amount });
  },

  completePurchase: (orderId: string, amount: number, productName: string) => {
    trackEvent('Purchase Completed', { orderId, amount, productName, revenue: amount });
  },

  // User events
  login: () => {
    trackEvent('User Login');
  },

  register: () => {
    trackEvent('User Register');
  },

  // Admin events
  adminAccess: (section: string) => {
    trackEvent('Admin Access', { section });
  },

  // Payment events
  paymentInitiated: (method: string, amount: number) => {
    trackEvent('Payment Initiated', { method, amount });
  },

  paymentFailed: (reason: string) => {
    trackEvent('Payment Failed', { reason });
  },

  // Navigation events
  clickCTA: (ctaName: string, location: string) => {
    trackEvent('CTA Clicked', { ctaName, location });
  },

  // Error tracking
  error: (errorType: string, errorMessage: string) => {
    trackEvent('Error', { errorType, errorMessage });
  },
};
