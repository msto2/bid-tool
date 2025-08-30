/**
 * Development Mode Configuration
 * Set DEV_MODE=true in .env to enable development features:
 * - Skip email/SMS sending (use console codes)
 * - Allow manager page access without email restriction
 * - Additional debugging features
 */

import { dev } from '$app/environment';

// Check for DEV_MODE environment variable or if we're in dev environment
export const isDevMode = true;

// Development settings
export const devConfig = {
  // Skip actual email/SMS sending in dev mode
  skipEmailSending: isDevMode,
  
  // Allow any email to access manager page in dev mode
  allowAnyManagerEmail: isDevMode,
  
  // Show verification codes in console/UI in dev mode
  showVerificationCodes: isDevMode,
  
  // Additional debug logging
  enableDebugLogging: isDevMode
};

// Log dev mode status
if (typeof console !== 'undefined' && isDevMode) {
  console.log('🔧 Development mode enabled:', devConfig);
}