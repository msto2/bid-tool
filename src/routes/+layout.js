// Completely disable SSR and hydration to prevent issues
export const ssr = false;
export const prerender = false;
export const csr = true;

// Force client-side only rendering
export const trailingSlash = 'ignore';