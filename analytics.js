// Vercel Web Analytics initialization
// This file imports and initializes Vercel Analytics using the @vercel/analytics package

import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject({
  mode: 'auto', // Automatically detects development vs production
  debug: false, // Set to true to see analytics events in console during development
});
