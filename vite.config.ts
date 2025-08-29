import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: true, 
		port: 5173,
		allowedHosts: ['bids.triplepoint.me', 'localhost', '127.0.0.1'],
		cors: true,
		// Add network access configuration
		hmr: {
			port: 5174 // Use different port for HMR to avoid conflicts
		}
	},
	preview: {
		host: true,
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
