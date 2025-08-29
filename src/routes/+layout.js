// Disable SSR for the entire application to prevent hydration issues
export const ssr = false;
export const prerender = false;

// Also disable client-side router for stability
export const csr = true;