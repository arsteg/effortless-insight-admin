// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable replay in production for admin portal
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block media for admin portal security
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out sensitive data
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== "production") {
      return null;
    }

    // Remove any PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          // Mask sensitive fields - more aggressive for admin portal
          const sensitiveFields = [
            "email", "password", "token", "gstin", "pan", "mobile",
            "apiKey", "secret", "authorization", "cookie"
          ];
          for (const field of sensitiveFields) {
            if (breadcrumb.data[field]) {
              breadcrumb.data[field] = "[REDACTED]";
            }
          }
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    "Network request failed",
    "Failed to fetch",
    "NetworkError",
    "AbortError",
    "Extension context invalidated",
  ],
});
