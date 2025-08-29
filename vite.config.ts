import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: '0.0.0.0',
		port: 5173,
		cors: true,
		// Configure HMR for proxy setup
		hmr: {
			// Use the same port as the main server to work through proxy
			port: 5173,
			host: 'bids.triplepoint.me',
			protocol: 'wss'
		},
		// Proxy configuration for development when accessed through domain
		proxy: {
			// This helps with API calls during development
		}
	},
	preview: {
		host: '0.0.0.0',
		port: 5173,
		cors: true
	},
	build: {
		rollupOptions: {
			output: {
				// Generate unique filenames for cache busting
				entryFileNames: 'assets/[name]-[hash].js',
				chunkFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
			}
		},
		// Ensure consistent builds
		minify: 'terser',
		sourcemap: true
	},
	plugins: [sveltekit()]
});
