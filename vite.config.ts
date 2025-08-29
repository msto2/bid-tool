import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: true, 
		port: 5173,
		allowedHosts: ['bids.triplepoint.me'],
		hmr: {
			port: 5173,
			host: 'localhost'
		}
	},
	build: {
		rollupOptions: {
			output: {
				// Generate unique filenames for cache busting
				entryFileNames: 'assets/[name]-[hash].js',
				chunkFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
			}
		}
	},
	plugins: [sveltekit()]
});
