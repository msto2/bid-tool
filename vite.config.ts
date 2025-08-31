import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: true, 
		port: 5173,
		allowedHosts: ['bids.triplepoint.me']
	},
	preview: {
		host: true,
		port: 4172
	},
	plugins: [sveltekit()]
});
